// DOM utilities
export default class DOMUtils {
  static getElement(id) {
    return document.getElementById(id);
  }

  static getElements(ids) {
    return ids.reduce((acc, id) => {
      acc[id] = this.getElement(id);
      return acc;
    }, {});
  }

  static showElement(element) {
    if (element) {
      element.style.display = 'flex';
    }
  }

  static hideElement(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  static showBlock(element) {
    if (element) {
      element.style.display = 'block';
    }
  }

  static addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  static removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  static toggleClass(element, className) {
    if (element) {
      element.classList.toggle(className);
    }
  }

  static setTextContent(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  static setInnerHTML(element, html) {
    if (element) {
      element.innerHTML = html;
    }
  }

  static addEventListener(element, event, handler) {
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  static removeEventListener(element, event, handler) {
    if (element) {
      element.removeEventListener(event, handler);
    }
  }

  static createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (innerHTML) {
      element.innerHTML = innerHTML;
    }
    return element;
  }

  static appendChild(parent, child) {
    if (parent && child) {
      parent.appendChild(child);
    }
  }

  static removeChild(parent, child) {
    if (parent && child) {
      parent.removeChild(child);
    }
  }

  static clearElement(element) {
    if (element) {
      element.innerHTML = '';
    }
  }

  static setAttribute(element, attribute, value) {
    if (element) {
      element.setAttribute(attribute, value);
    }
  }

  static getAttribute(element, attribute) {
    return element ? element.getAttribute(attribute) : null;
  }

  static focusElement(element) {
    if (element) {
      element.focus();
    }
  }

  static blurElement(element) {
    if (element) {
      element.blur();
    }
  }

  static scrollToElement(element, behavior = 'smooth') {
    if (element) {
      element.scrollIntoView({ behavior, block: 'start' });
    }
  }

  static isElementVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  static getElementRect(element) {
    return element ? element.getBoundingClientRect() : null;
  }
}
