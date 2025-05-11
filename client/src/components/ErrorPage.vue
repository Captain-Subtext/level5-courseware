<script setup lang="ts">
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  code?: number;
  message?: string;
  title?: string;
}>();

const router = useRouter();

const errorCode = props.code || 404;
const errorTitle = props.title || (errorCode === 404 ? 'Page Not Found' : 'Error');
const errorMessage = props.message || (
  errorCode === 404
    ? 'The page you are looking for does not exist or has been moved.'
    : 'An unexpected error occurred. Please try again later.'
);

function goBack() {
  router.back();
}

function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="flex min-h-[70vh] flex-col items-center justify-center text-center">
    <div class="space-y-5">
      <h1 class="text-6xl font-bold text-primary">{{ errorCode }}</h1>
      <h2 class="text-2xl font-medium tracking-tight">{{ errorTitle }}</h2>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      
      <div class="flex justify-center gap-4 mt-8">
        <button 
          @click="goBack"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go Back
        </button>
        <button 
          @click="goHome"
          class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
</template> 