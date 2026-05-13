<template>
    <keep-alive :include="cachedViews">
        <router-view />
    </keep-alive>
</template>

<script setup>
import { computed } from 'vue'
import useTagsViewStore from '@/store/modules/tagsView'

const tagsViewStore = useTagsViewStore()
const cachedViews = computed(() => tagsViewStore.cachedViews)
</script>