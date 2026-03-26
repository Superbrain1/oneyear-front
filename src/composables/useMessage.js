import { ref } from 'vue';

export function useMessage() {
  const message = ref('');

  function showMessage(text, duration = 3000) {
    message.value = text;
    setTimeout(() => {
      if (message.value === text) {
        message.value = '';
      }
    }, duration);
  }

  return {
    message,
    showMessage
  };
}
