<template>
  <div class="auth-container">
    <div class="auth-wrapper" :class="{ 'is-register-mode': !isLogin }">
      <!-- Left: Visual Decoration -->
      <div class="auth-visual">
        <div class="visual-content">
          <div class="geometric-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
            <div class="shape shape-6"></div>
          </div>
          <div class="visual-text">
            <h2>探索知识，启迪未来</h2>
            <p>智能学习 · AI 题库 · 知识管理</p>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="auth-form-panel">
        <div class="form-wrapper">
          <div class="logo">OpenStudy</div>

          <!-- Tabs -->
          <div class="auth-tabs">
            <div class="tab-header">
              <button class="tab-btn" :class="{ active: isLogin }" @click="switchToLogin">登录</button>
              <button class="tab-btn" :class="{ active: !isLogin }" @click="switchToRegister">注册</button>
              <div class="tab-indicator" :class="{ 'indicator-right': !isLogin }"></div>
            </div>
          </div>

          <!-- Forms -->
          <div class="forms-container">
            <div class="forms-track" :class="{ 'track-register': !isLogin }">
              <!-- Login Form -->
              <div class="form-panel">
                <el-form ref="loginRef" :model="loginForm" :rules="loginRules">
                  <el-form-item prop="username">
                    <el-input v-model="loginForm.username" type="text" size="large" auto-complete="off"
                      placeholder="账号">
                      <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
                    </el-input>
                  </el-form-item>
                  <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" size="large" auto-complete="off"
                      placeholder="密码" show-password @keyup.enter="handleLogin">
                      <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
                    </el-input>
                  </el-form-item>
                  <el-form-item prop="code" v-if="captchaEnabled">
                    <div class="captcha-wrap">
                      <el-input v-model="loginForm.code" size="large" auto-complete="off" placeholder="验证码"
                        @keyup.enter="handleLogin">
                        <template #prefix><svg-icon icon-class="validCode"
                            class="el-input__icon input-icon" /></template>
                      </el-input>
                      <img :src="codeUrl" @click="getCode" class="captcha-img" />
                    </div>
                  </el-form-item>
                  <el-checkbox v-model="loginForm.rememberMe" class="remember-checkbox">记住密码</el-checkbox>
                  <el-form-item>
                    <el-button :loading="loading" size="large" class="submit-btn" @click.prevent="handleLogin">
                      <span v-if="!loading">登 录</span>
                      <span v-else>登 录 中...</span>
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <!-- Register Form -->
              <div class="form-panel">
                <el-form ref="registerRef" :model="registerForm" :rules="registerRules">
                  <el-form-item prop="username">
                    <el-input v-model="registerForm.username" type="text" size="large" auto-complete="off"
                      placeholder="账号">
                      <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
                    </el-input>
                  </el-form-item>
                  <el-form-item prop="password">
                    <el-input v-model="registerForm.password" type="password" size="large" auto-complete="off"
                      placeholder="密码" show-password @keyup.enter="handleRegister">
                      <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
                    </el-input>
                  </el-form-item>
                  <el-form-item prop="confirmPassword">
                    <el-input v-model="registerForm.confirmPassword" type="password" size="large" auto-complete="off"
                      placeholder="确认密码" show-password @keyup.enter="handleRegister">
                      <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
                    </el-input>
                  </el-form-item>
                  <el-form-item prop="code" v-if="captchaEnabled">
                    <div class="captcha-wrap">
                      <el-input v-model="registerForm.code" size="large" auto-complete="off" placeholder="验证码"
                        @keyup.enter="handleRegister">
                        <template #prefix><svg-icon icon-class="validCode"
                            class="el-input__icon input-icon" /></template>
                      </el-input>
                      <img :src="codeUrl" @click="getCode" class="captcha-img" />
                    </div>
                  </el-form-item>
                  <el-form-item>
                    <el-button :loading="loading" size="large" class="submit-btn" @click.prevent="handleRegister">
                      <span v-if="!loading">注 册</span>
                      <span v-else>注 册 中...</span>
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>

          <!-- Bottom Links -->
          <div class="form-footer">
            <span v-if="isLogin" class="link" @click="switchToRegister">没有账号？立即注册</span>
            <span v-else class="link" @click="switchToLogin">已有账号？立即登录</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCodeImg, register as registerApi } from "@/api/login";
import Cookies from "js-cookie";
import { encrypt, decrypt } from "@/utils/jsencrypt";
import useUserStore from '@/store/modules/user'
import { ElMessageBox } from "element-plus";
import { toRaw } from 'vue'

const userStore = useUserStore()
const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const isLogin = ref(true)
const redirect = ref(undefined)

watch(() => route.path, (path) => {
  if (path === '/login') {
    isLogin.value = true
  } else if (path === '/register') {
    isLogin.value = false
  }
}, { immediate: true })

watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect;
}, { immediate: true });

function switchToLogin() {
  if (isLogin.value) return
  isLogin.value = true
  router.replace('/login')
}

function switchToRegister() {
  if (!isLogin.value) return
  isLogin.value = false
  router.replace('/register')
}

// ===================== Login Logic =====================

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
const captchaEnabled = ref(true);

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

        if (isAdmin) {
          targetPath = '/index/home'
        } else {
          if (!targetPath || targetPath === '/' || targetPath === '/index/home') {
            targetPath = '/front/index'
          }
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

// ===================== Register Logic =====================

const registerForm = ref({
  username: "",
  password: "",
  confirmPassword: "",
  code: "",
  uuid: ""
});

const equalToPassword = (rule, value, callback) => {
  if (registerForm.value.password !== value) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const registerRules = {
  username: [
    { required: true, trigger: "blur", message: "请输入您的账号" },
    { min: 2, max: 20, message: "用户账号长度必须介于 2 和 20 之间", trigger: "blur" }
  ],
  password: [
    { required: true, trigger: "blur", message: "请输入您的密码" },
    { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, trigger: "blur", message: "请再次输入您的密码" },
    { required: true, validator: equalToPassword, trigger: "blur" }
  ],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
};

function handleRegister() {
  proxy.$refs.registerRef.validate(valid => {
    if (valid) {
      loading.value = true;
      registerApi(registerForm.value).then(res => {
        const username = registerForm.value.username;
        ElMessageBox.alert("<font color='red'>恭喜你，您的账号 " + username + " 注册成功！</font>", "系统提示", {
          dangerouslyUseHTMLString: true,
          type: "success",
        }).then(() => {
          switchToLogin()
        }).catch(() => { });
      }).catch(() => {
        loading.value = false;
        if (captchaEnabled) {
          getCode();
        }
      });
    }
  });
}

// ===================== Shared Logic =====================

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img;
      loginForm.value.uuid = res.uuid;
      registerForm.value.uuid = res.uuid;
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
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #f5f7fa;
  overflow: hidden;
}

.auth-wrapper {
  display: flex;
  width: 1000px;
  max-width: calc(100vw - 40px);
  height: 640px;
  max-height: calc(100vh - 40px);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ========== Left Visual ========== */
.auth-visual {
  flex: 0 0 50%;
  position: relative;
  background: linear-gradient(135deg, #f8f9fb 0%, #eef1f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-register-mode .auth-visual {
  background: linear-gradient(135deg, #eef1f5 0%, #e8ecf2 100%);
}

.visual-content {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.visual-text {
  position: relative;
  z-index: 2;
  margin-top: 20px;

  h2 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 10px 0;
    letter-spacing: 1px;
  }

  p {
    font-size: 24px;
    color: #9ca3af;
    margin: 0;
    letter-spacing: 2px;
  }
}

/* Geometric Shapes */
.geometric-shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.shape-1 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(26, 58, 92, 0.08), transparent 70%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.shape-2 {
  width: 300px;
  height: 300px;
  border: 2px solid rgba(26, 58, 92, 0.06);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-80%, -80%);
}

.shape-3 {
  width: 120px;
  height: 120px;
  border: 2px solid rgba(45, 90, 135, 0.05);
  border-radius: 16px;
  top: 50%;
  left: 50%;
  transform: translate(60%, -100%) rotate(20deg);
}

.shape-4 {
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(26, 58, 92, 0.06), transparent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, 60%);
}

.shape-6 {
  width: 0;
  height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-bottom: 70px solid rgba(26, 58, 92, 0.06);
  top: 50%;
  left: 50%;
  transform: translate(110%, 60%) rotate(0deg);
}

.is-register-mode .shape-2 {
  transform: translate(-80%, -80%) rotate(10deg);
}

.is-register-mode .shape-3 {
  transform: translate(60%, -100%) rotate(35deg);
}

.is-register-mode .shape-6 {
  transform: translate(110%, 60%) rotate(15deg);
}

/* ========== Right Form ========== */
.auth-form-panel {
  flex: 0 0 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
}

.logo {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  text-align: center;
  margin-bottom: 32px;
  letter-spacing: 1px;
}

/* Tabs */
.auth-tabs {
  margin-bottom: 28px;
}

.tab-header {
  position: relative;
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0;
}

.tab-btn {
  flex: 1;
  padding: 0 0 12px 0;
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.3s ease;
  outline: none;
  text-align: center;

  &.active {
    color: #1f2937;
  }

  &:hover {
    color: #6b7280;
  }
}

.tab-indicator {
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 50%;
  height: 2px;
  background: #1f2937;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 1px;

  &.indicator-right {
    transform: translateX(100%);
  }
}

/* Forms */
.forms-container {
  overflow: hidden;
  min-height: 300px;
}

.forms-track {
  display: flex;
  width: 200%;
  min-height: 300px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);

  &.track-register {
    transform: translateX(-50%);
  }
}

.form-panel {
  flex: 0 0 50%;
  padding: 4px 4px 0;

  .el-form {
    height: 100%;
    display: flex;
    flex-direction: column;

    .el-form-item:last-child {
      margin-top: auto;
      margin-bottom: 0;
    }
  }
}

.captcha-wrap {
  display: flex;
  width: 100%;
  gap: 12px;

  .el-input {
    flex: 1;
  }
}

.captcha-img {
  width: 110px;
  height: 44px;
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
}

.remember-checkbox {
  margin: 0 0 20px 0;
  display: flex;

  .el-checkbox__label {
    color: #6b7280;
    font-size: 14px;
  }
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: #1f2937;
  border: none;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: #1a3a5c;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(26, 58, 92, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-loading {
    background: #9ca3af;
  }
}

.form-footer {
  text-align: center;
  margin-top: 24px;
}

.link {
  font-size: 14px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #1a3a5c;
  }
}

/* ========== Input Overrides ========== */
:deep(.el-input) {
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
      box-shadow: 0 0 0 1px #1f2937;
    }
  }
}

:deep(.input-icon) {
  height: 44px;
  width: 16px;
  margin-left: 0;
  color: #9ca3af;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-checkbox) {
  .el-checkbox__inner {
    border-radius: 4px;
    border-color: #d1d5db;

    &::after {
      border-color: #fff;
    }
  }

  &.is-checked .el-checkbox__inner {
    background-color: #1f2937;
    border-color: #1f2937;
  }
}

/* ========== Responsive ========== */

/* Large screens: 27-inch+ (2560px+) */
@media (min-width: 2000px) {
  .auth-wrapper {
    width: 1300px;
    height: 760px;
  }

  .form-wrapper {
    max-width: 440px;
  }

  .logo {
    font-size: 34px;
    margin-bottom: 40px;
  }

  .visual-text h2 {
    font-size: 40px;
  }

  .visual-text p {
    font-size: 30px;
  }

  .shape-1 {
    width: 600px;
    height: 600px;
  }

  .shape-2 {
    width: 380px;
    height: 380px;
  }

  .shape-3 {
    width: 160px;
    height: 160px;
  }

  .shape-6 {
    border-left-width: 50px;
    border-right-width: 50px;
    border-bottom-width: 88px;
  }
}

/* Large screens: 24-inch (1920px+) */
@media (min-width: 1600px) and (max-width: 1999px) {
  .auth-wrapper {
    width: 1200px;
    height: 720px;
  }

  .form-wrapper {
    max-width: 400px;
  }

  .logo {
    font-size: 30px;
    margin-bottom: 36px;
  }

  .visual-text h2 {
    font-size: 36px;
  }

  .shape-1 {
    width: 540px;
    height: 540px;
  }

  .shape-2 {
    width: 340px;
    height: 340px;
  }
}

/* Medium-large: 16-inch laptop (1440px-1600px) */
@media (min-width: 1200px) and (max-width: 1599px) {
  .auth-wrapper {
    width: 1100px;
    height: 680px;
  }

  .form-wrapper {
    max-width: 380px;
  }

  .shape-1 {
    width: 500px;
    height: 500px;
  }

  .shape-2 {
    width: 300px;
    height: 300px;
  }
}

/* Default: 1000-1200px fits most 16-inch at 1920×1080 scaling */

/* Compact: 14-inch laptop / small desktop */
@media (max-width: 1100px) {
  .auth-wrapper {
    width: 960px;
    height: 620px;
  }

  .auth-form-panel {
    padding: 32px;
  }

  .form-wrapper {
    max-width: 330px;
  }

  .shape-1 {
    width: 420px;
    height: 420px;
  }

  .shape-2 {
    width: 260px;
    height: 260px;
  }
}

/* 14-inch laptop at 1366×768 — shorter height */
@media (max-height: 780px) {
  .auth-wrapper {
    height: 560px;
  }

  .auth-form-panel {
    padding: 24px 32px;
  }

  .logo {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .auth-tabs {
    margin-bottom: 20px;
  }
}

/* Tablet / narrow desktop */
@media (max-width: 1024px) {
  .auth-wrapper {
    width: 900px;
    height: 580px;
  }

  .auth-form-panel {
    padding: 28px;
  }

  .form-wrapper {
    max-width: 300px;
  }

  .visual-text h2 {
    font-size: 28px;
  }

  .visual-text p {
    font-size: 22px;
  }

  .shape-1 {
    width: 320px;
    height: 320px;
  }

  .shape-2 {
    width: 200px;
    height: 200px;
  }

  .shape-3 {
    width: 100px;
    height: 100px;
  }

  .shape-4 {
    width: 140px;
  }
}

/* Small tablet */
@media (max-width: 900px) {
  .auth-wrapper {
    width: 100%;
    height: 520px;
  }

  .auth-form-panel {
    padding: 24px;
  }

  .form-wrapper {
    max-width: 280px;
  }

  .shape-1 {
    width: 280px;
    height: 280px;
  }

  .shape-2 {
    width: 160px;
    height: 160px;
  }
}

/* Mobile landscape */
@media (max-width: 768px) {
  .auth-visual {
    display: none;
  }

  .auth-form-panel {
    flex: 0 0 100%;
    padding: 40px 32px;
  }

  .form-wrapper {
    max-width: 360px;
  }

  .auth-wrapper {
    width: 100%;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }
}

/* Mobile portrait */
@media (max-width: 480px) {
  .auth-form-panel {
    padding: 32px 20px;
  }

  .logo {
    font-size: 24px;
    margin-bottom: 24px;
  }
}
</style>
