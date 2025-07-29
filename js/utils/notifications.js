// Notification utilities
export class NotificationManager {
  static showSuccess(message, options = {}) {
    const defaultOptions = {
      icon: 'success',
      title: '¡Éxito!',
      text: message,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    };

    this.showNotification({ ...defaultOptions, ...options });
  }

  static showError(message, options = {}) {
    const defaultOptions = {
      icon: 'error',
      title: 'Error',
      text: message,
      toast: true,
      position: 'top-end',
    };

    this.showNotification({ ...defaultOptions, ...options });
  }

  static showWarning(message, options = {}) {
    const defaultOptions = {
      icon: 'warning',
      title: 'Advertencia',
      text: message,
      toast: true,
      position: 'top-end',
    };

    this.showNotification({ ...defaultOptions, ...options });
  }

  static showInfo(message, options = {}) {
    const defaultOptions = {
      icon: 'info',
      title: 'Información',
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    };

    this.showNotification({ ...defaultOptions, ...options });
  }

  static showConfirmation(message, callback, options = {}) {
    const defaultOptions = {
      title: '¿Estás seguro?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
    };

    this.showNotification({ ...defaultOptions, ...options }).then((result) => {
      if (result.isConfirmed && callback) {
        callback();
      }
    });
  }

  static showInput(title, inputLabel, inputPlaceholder, callback, options = {}) {
    const defaultOptions = {
      title,
      input: 'text',
      inputLabel,
      inputPlaceholder,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Este campo es requerido';
        }
      },
    };

    this.showNotification({ ...defaultOptions, ...options }).then((result) => {
      if (result.isConfirmed && callback) {
        callback(result.value);
      }
    });
  }

  static showLoading(title = 'Cargando...') {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }
  }

  static hideLoading() {
    if (typeof Swal !== 'undefined') {
      Swal.close();
    }
  }

  static showNotification(options) {
    if (typeof Swal !== 'undefined') {
      return Swal.fire(options);
    }
    // Fallback to console and alert
    console.log(`${options.title}: ${options.text}`);
    if (options.icon === 'error') {
      alert(`Error: ${options.text}`);
    } else if (options.icon === 'warning') {
      alert(`Advertencia: ${options.text}`);
    } else {
      alert(options.text);
    }
    return Promise.resolve({ isConfirmed: true });
  }

  // Toast notifications (alternative to SweetAlert)
  static showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full';

    const typeClasses = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-black',
      info: 'bg-blue-500 text-white',
    };

    toast.classList.add(...typeClasses[type].split(' '));
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    // Animate out and remove
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // Progress bar
  static showProgress(title = 'Procesando...', progress = 0) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title,
        html: `
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
          </div>
          <div class="mt-2 text-sm text-gray-600">${progress}% completado</div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
      });
    }
  }

  static updateProgress(progress) {
    if (typeof Swal !== 'undefined') {
      const progressBar = document.querySelector('.bg-blue-600');
      const progressText = document.querySelector('.text-gray-600');

      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }

      if (progressText) {
        progressText.textContent = `${progress}% completado`;
      }
    }
  }
}
