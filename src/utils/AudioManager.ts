import { Howl } from 'howler'

export default class AudioManager {
  private ambientSound: Howl | null = null
  private isInitialized: boolean = false

  init(): void {
    if (this.isInitialized) return

    // Create ambient wind sound using Web Audio API
    try {
      this.ambientSound = new Howl({
        src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT' +
                    'AkZUqzq67JlGAUvgs/w2oo3CR1tvfHjl0kKEFus6O2yYhQGMJDF8tiLOAcfZ8D05JdLCRFYrOnrr2gVBSyAy/LZijYJG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWUAkZUqzq67JlGAUvgs/w2oo3CR1tvfHjl0kKEFus6O2yYhQGMJDF8tiLOAcfZ8D05JdLCRFYrOnrr2gVBSyAy/LZijYJG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWUAkZUqzq67JlGAUvgs/w2oo3CR1tvfHjl0kKEFus6O2yYhQGMJDF8tiLOAcfZ8D05JdLCRFYrOnrr2gVBSyAy/LZijYJG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWUAkZUqzq67JlGAUvgs/w2oo3CR1tvfHjl0kKEFus6O2yYhQGMJDF8tiLOAcfZ8D05JdLCRFYrOnrr2gVBSyAy/LZijYJG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWUAkZUqzq67JlGAUvgs/w2oo3CR1tvfHjl0kKEFus6O2yYhQGMJDF8tiLOAcfZ8D05JdLCRFYrOnrr2gVBSyAy/LZijYJG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWUA'],
        loop: true,
        volume: 0.3,
        autoplay: false
      })
      
      this.isInitialized = true
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  }

  playAmbientSound(): void {
    if (this.ambientSound && this.isInitialized) {
      this.ambientSound.play()
    }
  }

  stopAmbientSound(): void {
    if (this.ambientSound) {
      this.ambientSound.stop()
    }
  }

  setAmbientVolume(volume: number): void {
    if (this.ambientSound) {
      this.ambientSound.volume(Math.max(0, Math.min(1, volume)))
    }
  }

  cleanup(): void {
    if (this.ambientSound) {
      this.ambientSound.unload()
      this.ambientSound = null
    }
    this.isInitialized = false
  }
}
