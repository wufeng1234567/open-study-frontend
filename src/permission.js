import router from './router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import { isRelogin } from '@/utils/request'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

NProgress.configure({ showSpinner: false });

const whiteList = ['/', '/login', '/register', '/front/index', '/front/courses', '/front/resources'];

router.beforeEach((to, from, next) => {
  NProgress.start()

  const token = getToken()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (token) {
    to.meta.title && useSettingsStore().setTitle(to.meta.title)

    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else if (to.path === '/') {
      if (userStore.roles.length === 0) {
        userStore.getInfo().then(() => {
          if (userStore.roles.includes('admin')) {
            next({ path: '/index/home' })
          } else {
            next({ path: '/front/index' })
          }
          NProgress.done()
        }).catch(() => {
          next({ path: '/front/index' })
          NProgress.done()
        })
      } else {
        if (userStore.roles.includes('admin')) {
          next({ path: '/index/home' })
        } else {
          next({ path: '/front/index' })
        }
        NProgress.done()
      }
    } else if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else if (to.path.startsWith('/index/') && !userStore.roles.includes('admin')) {
      next({ path: '/front/index' })
      NProgress.done()
    } else {
      if (userStore.roles.length === 0) {
        isRelogin.show = true

        userStore.getInfo().then(() => {
          isRelogin.show = false

          permissionStore.generateRoutes().then(accessRoutes => {
            accessRoutes.forEach(route => {
              if (!isHttp(route.path)) {
                router.addRoute(route)
              }
            })
            next({ ...to, replace: true })
          }).catch(err => {
            isRelogin.show = false
            next('/front/index')
            NProgress.done()
          })
        }).catch(err => {
          isRelogin.show = false
          userStore.clearState()
          next(`/login?redirect=${to.fullPath}`)
          NProgress.done()
        })
      } else {
        if (permissionStore.addRoutes.length === 0) {
          permissionStore.generateRoutes().then(accessRoutes => {
            accessRoutes.forEach(route => {
              if (!isHttp(route.path)) {
                router.addRoute(route)
              }
            })
            next({ ...to, replace: true })
          })
        } else {
          next()
        }
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      if (to.path === '/') {
        next('/login')
      } else {
        next(`/login?redirect=${to.fullPath}`)
      }
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
