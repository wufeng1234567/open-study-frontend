// store/modules/frontPageCache.js
export const useFrontPageCacheStore = defineStore('frontPageCache', {
    state: () => ({
        lastVisitedMap: {},
        cachedForms: {}  // 新增
    }),
    actions: {
        setLastVisited(pageKey, path) { this.lastVisitedMap[pageKey] = path },
        getLastVisited(pageKey, defaultPath = 'home') { return this.lastVisitedMap[pageKey] || defaultPath },
        // 新增方法
        setCachedForm(formKey, data) { this.cachedForms[formKey] = data },
        getCachedForm(formKey) { return this.cachedForms[formKey] || null },
        clearCachedForm(formKey) { delete this.cachedForms[formKey] }
    },
    persist: {
        enabled: true,
        strategies: [{ storage: localStorage, paths: ['lastVisitedMap', 'cachedForms'] }]
    }
})