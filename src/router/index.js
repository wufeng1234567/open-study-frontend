import { createWebHistory, createRouter } from 'vue-router'

// 公共路由
export const constantRoutes = [
  {
    path: '/redirect',
    component: () => import('@/layout/index.vue'),
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/auth'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/auth'),
    hidden: true
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import('@/views/error/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },

  // 后台首页
  {
    path: '/index',
    component: () => import('@/layout/index.vue'),
    redirect: '/index/home',
    meta: { title: '后台首页', icon: 'dashboard' },
    children: [
      {
        path: 'home',
        name: 'Index',
        component: () => import('@/views/admin/dashboard.vue'),
        meta: { title: '后台首页', icon: 'dashboard', affix: true }
      }
    ]
  },

  // 根路径重定向
  {
    path: '/',
    redirect: '/index/home'
  },

  // 后台个人中心 - 使用后台 Layout
  {
    path: '/user',
    component: () => import('@/layout/index.vue'),
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index.vue'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  },

  // 前台路由
  {
    path: '/front',
    component: () => import('@/layout/front.vue'),
    hidden: true,
    redirect: '/front/index',
    meta: { layout: 'front' },
    children: [
      {
        path: 'index',
        name: 'FrontIndex',
        component: () => import('@/views/front/index.vue'),
        meta: { title: '前台首页', layout: 'front' },
        hidden: true
      },
      {
        path: 'questionPractice',
        name: 'FrontQuestionPractice',
        component: () => import('@/views/questionPractice/questionPractice/index.vue'),
        meta: { title: '题库练习', layout: 'front' },
        hidden: true,
        children: [
          {
            path: '',
            name: 'FrontQuestionBankList',
            component: () => import('@/views/questionPractice/questionPractice/bankList.vue'),
            meta: { title: '题库练习', layout: 'front', keepAlive: true }
          },
          {
            path: ':bankId',
            name: 'FrontQuestionBankDetail',
            component: () => import('@/views/questionPractice/questionPractice/bankDetail.vue'),
            meta: { title: '题库详情', layout: 'front', keepAlive: true }
          },
          {
            path: ':bankId/practice/:moduleType',
            name: 'FrontQuestionPracticePlay',
            component: () => import('@/views/questionPractice/questionPractice/practice.vue'),
            meta: { title: '刷题练习', layout: 'front', keepAlive: true }
          }
        ]
      },
      {
        path: 'tools',
        name: 'FrontTools',
        component: () => import('@/views/front/tools/index.vue'),
        meta: { title: '实用工具箱', layout: 'front' },
        redirect: '/front/tools/home',
        children: [
          {
            path: 'home',
            name: 'FrontToolsHome',
            component: () => import('@/views/front/tools/home.vue'),
            meta: { title: '实用工具箱', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'watermark',
            name: 'FrontToolsWatermark',
            component: () => import('@/views/front/resources/index.vue'),
            meta: { title: '图片水印工具', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'convert',
            name: 'FrontToolsConvert',
            component: () => import('@/views/front/tools/convert.vue'),
            meta: { title: '文档转换工具', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'image',
            name: 'FrontToolsImage',
            component: () => import('@/views/front/tools/image.vue'),
            meta: { title: '图片处理工具', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'classDiagram',
            name: 'FrontToolsClassDiagram',
            component: () => import('@/views/front/tools/classDiagram.vue'),
            meta: { title: '类图生成', layout: 'front', keepAlive: true },
            hidden: true
          }
        ]
      },
      {
        path: 'profile/:userId?',
        name: 'FrontProfile',
        component: () => import('@/views/system/user/profile/index.vue'),
        meta: { title: '个人中心', layout: 'front' },
        hidden: true
      },

      // ✅ 消息中心
      {
        path: 'messages',
        name: 'FrontMessages',
        component: () => import('@/views/front/messages/index.vue'),
        meta: { title: '消息中心', layout: 'front' },
        redirect: '/front/messages/notifications',
        children: [
          {
            path: 'notifications',
            name: 'FrontMessagesNotifications',
            component: () => import('@/views/front/messages/notifications.vue')
          },
          {
            path: 'mentions',
            name: 'FrontMessagesMentions',
            component: () => import('@/views/front/messages/mentions.vue')
          },
          {
            path: 'chats',
            name: 'FrontMessagesChats',
            component: () => import('@/views/front/messages/chats.vue')
          }
        ]
      },

      // ✅ 我的学习聚合页面
      {
        path: 'myQuestion',
        name: 'FrontMyQuestion',
        component: () => import('@/views/front/myQuestion/index.vue'),
        // redirect: '/front/myQuestion/myBank',
        meta: { title: '我的学习', layout: 'front' },
        hidden: true,
        children: [
          {
            path: 'bankCollect',
            name: 'FrontBankCollect',
            component: () => import('@/views/front/myQuestion/myFavoriteBank/index.vue'),
            meta: { title: '题库收藏', layout: 'front' },
            hidden: true
          },
          {
            path: 'questionCollect',
            name: 'FrontQuestionCollect',
            component: () => import('@/views/front/myQuestion/myFavoriteQuestion/index.vue'),
            meta: { title: '题目收藏', layout: 'front' },
            hidden: true
          },
          {
            path: 'wrongQuestion',
            name: 'FrontWrongQuestion',
            component: () => import('@/views/front/myQuestion/myMistakes/index.vue'),
            meta: { title: '我的错题', layout: 'front' },
            hidden: true
          },
          {
            path: 'masteredQuestion',
            name: 'FrontMasteredQuestion',
            component: () => import('@/views/front/myQuestion/myMarked/index.vue'),
            meta: { title: '我的斩题', layout: 'front' },
            hidden: true
          },
          {
            path: 'myBank',
            name: 'FrontMyBank',
            component: () => import('@/views/front/myQuestion/myBank/index.vue'),
            meta: { title: '我的题库', layout: 'front' },
            hidden: true
          },
          {
            path: 'myNotes',
            name: 'FrontMyNotes',
            component: () => import('@/views/front/myQuestion/myNotes/index.vue'),
            meta: { title: '我的笔记', layout: 'front' },
            hidden: true
          }
        ]
      },
      // studio 改成嵌套路由
      {
        path: 'studio',
        name: 'FrontStudio',
        component: () => import('@/views/front/studio/index.vue'),  // 容器组件
        meta: { title: '上传题库', layout: 'front' },
        hidden: true,
        children: [
          {
            path: '',
            name: 'FrontStudioHome',
            component: () => import('@/views/front/studio/home.vue'),  // 原 index.vue 改名为 home.vue
            meta: { title: '上传题库', layout: 'front', keepAlive: true }
          },
          {
            path: 'create',
            name: 'FrontStudioCreate',
            component: () => import('@/views/front/studio/create/index.vue'),
            meta: { title: '创建题库', layout: 'front', keepAlive: true }
          }
        ]
      },

      {
        path: 'english',
        name: 'FrontEnglish',
        component: () => import('@/views/front/english/index.vue'),
        meta: { title: '英语学习', layout: 'front' },
        hidden: true,
        children: [
          {
            path: 'home',
            name: 'FrontEnglishHome',
            component: () => import('@/views/front/english/home/index.vue'),
            meta: { title: '英语学习', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'ocr',
            name: 'FrontEnglishOcr',
            component: () => import('@/views/front/english/ocr/index.vue'),
            meta: { title: '拍照识词', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'vocabulary',
            name: 'FrontEnglishVocabulary',
            component: () => import('@/views/front/english/vocabulary/index.vue'),
            meta: { title: '我的词库', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'vocabulary/:id',
            name: 'FrontEnglishVocabularyDetail',
            component: () => import('@/views/front/english/vocabulary/detail.vue'),
            meta: { title: '词库详情', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'listening',
            name: 'FrontEnglishListening',
            component: () => import('@/views/front/english/listening/index.vue'),
            meta: { title: '听力练习', layout: 'front', keepAlive: true },
            hidden: true
          },
          {
            path: 'reading',
            name: 'FrontEnglishReading',
            component: () => import('@/views/front/english/reading/index.vue'),
            meta: { title: '阅读练习', layout: 'front', keepAlive: true },
            hidden: true
          }
        ]
      },

      // 知识库管理
      {
        path: 'knowledge',
        name: 'FrontKnowledge',
        component: () => import('@/views/front/knowledge/index.vue'),  // 容器组件
        meta: { title: '知识库', layout: 'front' },
        // redirect: '/front/knowledge/home',
        children: [
          {
            path: 'home',
            name: 'FrontKnowledgeHome',
            component: () => import('@/views/front/knowledge/home.vue'),
            meta: { title: '知识库', layout: 'front', keepAlive: true }
          },
          {
            path: 'list',
            name: 'FrontKnowledgeList',
            component: () => import('@/views/front/knowledge/list.vue'),
            meta: { title: '知识库列表', layout: 'front', keepAlive: true }
          },
          {
            path: 'upload/:id',
            name: 'FrontKnowledgeUpload',
            component: () => import('@/views/front/knowledge/upload.vue'),
            meta: { title: '上传文档', layout: 'front', keepAlive: true }
          },
          {
            path: 'qa/:id',
            name: 'FrontKnowledgeQa',
            component: () => import('@/views/front/knowledge/qa.vue'),
            meta: { title: '知识库问答', layout: 'front', keepAlive: true }
          },
          {
            path: 'docs/:id',
            name: 'FrontKnowledgeDocs',
            component: () => import('@/views/front/knowledge/docs.vue'),
            meta: { title: '文档列表', layout: 'front', keepAlive: true }
          }
        ]
      },

      // 学习分享
      {
        path: 'notes',
        name: 'FrontNotes',
        component: () => import('@/views/front/notes/index.vue'),
        meta: { title: '学习分享', layout: 'front' },
        hidden: true,
        children: [
          {
            path: 'list',
            name: 'FrontNotesList',
            component: () => import('@/views/front/notes/list.vue'),
            meta: { title: '学习分享', layout: 'front', keepAlive: true }
          },
          {
            path: 'detail/:id',
            name: 'FrontNotesDetail',
            component: () => import('@/views/front/notes/detail.vue'),
            meta: { title: '笔记详情', layout: 'front', keepAlive: true }
          },
          {
            path: 'editor',
            name: 'FrontNotesEditor',
            component: () => import('@/views/front/notes/editor.vue'),
            meta: { title: '写笔记', layout: 'front' },
            hidden: true
          }
        ]
      }
    ]
  }
]

// 动态路由
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: () => import('@/layout/index.vue'),
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: () => import('@/layout/index.vue'),
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: () => import('@/layout/index.vue'),
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data'),
        name: 'Data',
        meta: { title: '字典数据', activeMenu: '/system/dict' }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: () => import('@/layout/index.vue'),
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/tool/gen-edit',
    component: () => import('@/layout/index.vue'),
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router