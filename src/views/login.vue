<template>
  <div class="login">
    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <h3 class="title">openstudy</h3>
      <el-form-item prop="username">
        <el-input v-model="loginForm.username" type="text" size="large" auto-complete="off" placeholder="账号">
          <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="loginForm.password" type="password" size="large" auto-complete="off" placeholder="密码"
          @keyup.enter="handleLogin">
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="code" v-if="captchaEnabled">
        <el-input v-model="loginForm.code" size="large" auto-complete="off" placeholder="验证码" style="width: 63%"
          @keyup.enter="handleLogin">
          <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
        </el-input>
        <div class="login-code">
          <img :src="codeUrl" @click="getCode" class="login-code-img" />
        </div>
      </el-form-item>
      <el-checkbox v-model="loginForm.rememberMe" style="margin:0px 0px 25px 0px;">记住密码</el-checkbox>
      <el-form-item style="width:100%;">
        <el-button :loading="loading" size="large" type="primary" style="width:100%;" @click.prevent="handleLogin">
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <div style="float: right;" v-if="register">
          <router-link class="link-type" :to="'/register'">立即注册</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <span>Copyright © 2018-2023 openstudy All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup>
import { getCodeImg } from "@/api/login";
import Cookies from "js-cookie";
import { encrypt, decrypt } from "@/utils/jsencrypt";
import useUserStore from '@/store/modules/user'
import { toRaw } from 'vue'

const userStore = useUserStore()
const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const loginForm = ref({
  username: "admin",
  password: "admin123",
  rememberMe: false,
  code: "",
  uuid: ""
});

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
};

const codeUrl = ref("");
const loading = ref(false);
// 验证码开关
const captchaEnabled = ref(true);
// 注册开关
const register = ref(true);
const redirect = ref(undefined);

watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect;
}, { immediate: true });

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true

      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }

      userStore.login(loginForm.value).then(() => {
        console.log('登录成功，用户角色:', userStore.roles)

        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})

        let targetPath = redirect.value
        const roles = toRaw(userStore.roles)
        const isAdmin = roles.includes('admin')

        console.log('是否管理员:', isAdmin)
        console.log('原始 redirect:', targetPath)

        // ✅ 管理员永远跳转后台，不管 redirect 是什么
        if (isAdmin) {
          // 管理员登录，强制去后台首页
          targetPath = '/index/home'
        } else {
          // 普通用户：有 redirect 就去 redirect，没有就去前台首页
          if (!targetPath || targetPath === '/' || targetPath === '/index/home') {
            targetPath = '/front/index'
          }
          // 否则保持 targetPath（比如 redirect=/front/courses）
        }

        console.log('最终跳转到:', targetPath)
        router.push({ path: targetPath, query: otherQueryParams })
      }).catch(() => {
        loading.value = false
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}
function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img;
      loginForm.value.uuid = res.uuid;
    }
  });
}

function getCookie() {
  const username = Cookies.get("username");
  const password = Cookies.get("password");
  const rememberMe = Cookies.get("rememberMe");
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  };
}

getCode();
getCookie();
</script>

<style lang='scss' scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url("../assets/images/login-background.jpg");
  background-size: cover;
}

.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
}

.login-form {
  border-radius: 16px;
  background: #ffffff;
  width: 400px;
  padding: 32px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }

  .el-input {
    height: 44px;

    input {
      height: 44px;
    }

    .el-input__wrapper {
      border-radius: 8px;
      box-shadow: 0 0 0 1px #e5e7eb;

      &:hover {
        box-shadow: 0 0 0 1px #d1d5db;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px #b3b3b3;
      }
    }
  }

  .input-icon {
    height: 44px;
    width: 16px;
    margin-left: 0px;
    color: #9ca3af;
  }

  .el-checkbox {
    margin: 20px 0;

    .el-checkbox__label {
      color: #6b7280;
      font-size: 14px;
    }
  }

  .el-button {
    border-radius: 8px;
    font-weight: 500;
    padding: 8px 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;

    &:hover {
      transform: translateY(-2px);
      border-color: #b3b3b3;
      color: #4b5563;
    }

    &:active {
      transform: translateY(0);
    }

    &.el-button--primary {
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
    }
  }

  .link-type {
    color: #6b7280;
    font-size: 14px;
    text-decoration: none;

    &:hover {
      color: #409eff;
    }
  }
}

.login-tip {
  font-size: 13px;
  text-align: center;
  color: #9ca3af;
}

.login-code {
  width: 33%;
  height: 44px;
  float: right;

  img {
    cursor: pointer;
    vertical-align: middle;
    border-radius: 8px;
  }
}

.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-code-img {
  height: 44px;
  padding-left: 12px;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .login-form {
    width: 90%;
    max-width: 400px;
    padding: 24px;
  }
}
</style>
