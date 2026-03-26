import { defineStore } from 'pinia';

export const usePWAStore = defineStore('pwa', {
    state: () => ({
        deferredPrompt: null,
        isInstallable: false,
        isInstalled: false
    }),
    actions: {
        setDeferredPrompt(prompt) {
            this.deferredPrompt = prompt;
            this.isInstallable = true;
        },
        async installApp() {
            if (!this.deferredPrompt) return;
            
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`[PWA] User response to the install prompt: ${outcome}`);
            
            // We've used the prompt, and can't use it again, throw it away
            this.deferredPrompt = null;
            this.isInstallable = false;
        },
        setIsInstalled(val) {
            this.isInstalled = val;
            this.isInstallable = !val;
        }
    }
});
