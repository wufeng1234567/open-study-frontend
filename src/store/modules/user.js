import { login, logout, getInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import defAva from '@/assets/images/profile.jpg'
import usePermissionStore from '@/store/modules/permission'
import router from '@/router'
import { isHttp } from '@/utils/validate'

const useUserStore = defineStore(
  'user',
  {
    state: () => ({
      token: getToken(),
      id: '',
      name: '',
      avatar: '',
      roles: [],
      permissions: []
    }),
    actions: {
      login(userInfo) {
        const username = userInfo.username.trim()
        const password = userInfo.password
        const code = userInfo.code
        const uuid = userInfo.uuid
        return new Promise((resolve, reject) => {
          login(username, password, code, uuid).then(res => {
            setToken(res.token)
            this.token = res.token
            this.getInfo().then(() => {
              const permissionStore = usePermissionStore()
              permissionStore.generateRoutes().then(accessRoutes => {
                accessRoutes.forEach(route => {
                  if (!isHttp(route.path)) {
                    router.addRoute(route)
                  }
                })
                resolve()
              }).catch(error => {
                reject(error)
              })
            }).catch(error => {
              reject(error)
            })
          }).catch(error => {
            reject(error)
          })
        })
      },

      getInfo() {
        return new Promise((resolve, reject) => {
          getInfo().then(res => {
            const user = res.user
            const avatar = (user.avatar == "" || user.avatar == null) ? defAva : import.meta.env.VITE_APP_BASE_API + user.avatar

            if (res.roles && res.roles.length > 0) {
              this.roles = res.roles
              this.permissions = res.permissions
            } else {
              this.roles = ['ROLE_DEFAULT']
            }
            this.id = user.userId
            this.name = user.userName
            this.avatar = avatar
            resolve(res)
          }).catch(error => {
            reject(error)
          })
        })
      },

      clearState() {
        this.token = ''
        this.roles = []
        this.permissions = []
        this.name = ''
        this.avatar = ''
        removeToken()
        const permissionStore = usePermissionStore()
        permissionStore.$reset()
      },

      logOut() {
        return new Promise((resolve) => {
          const savedToken = this.token
          this.clearState()
          try {
            sessionStorage.clear()
          } catch (e) {
            console.warn('sessionStorage 清除失败:', e)
          }
          const projectKeys = ['user', 'permission', 'tagsView', 'settings']
          projectKeys.forEach(key => {
            try {
              if (localStorage.getItem(key)) {
                localStorage.removeItem(key)
              }
            } catch (e) {
              console.warn(`localStorage.${key} 清除失败:`, e)
            }
          })
          logout(savedToken).catch(() => {})
          resolve()
        })
      }
    }
  })

export default useUserStore
