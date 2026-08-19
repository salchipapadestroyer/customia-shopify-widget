(() => {
  const JOB_PROPERTY = "_customia3d_job_id";
  const instances = new WeakSet();

  class Customia3D {
    constructor(root) {
      this.root = root;
      this.input = root.querySelector("[data-customia3d-input]");
      this.selection = root.querySelector("[data-customia3d-selection]");
      this.preview = root.querySelector("[data-customia3d-preview]");
      this.fileName = root.querySelector("[data-customia3d-filename]");
      this.status = root.querySelector("[data-customia3d-status]");
      this.error = root.querySelector("[data-customia3d-error]");
      this.replace = root.querySelector("[data-customia3d-replace]");
      this.productId = root.dataset.productId;
      this.productHandle = root.dataset.productHandle || "";
      this.proxyPath = (root.dataset.proxyPath || "/apps/customia-3d").replace(/\/$/, "");
      this.formSelector = root.dataset.formSelector?.trim() || "";
      this.required = root.dataset.required === "true";
      this.maxBytes = Number(root.dataset.maxFileMb || 15) * 1024 * 1024;
      this.jobId = null;
      this.objectUrl = null;

      this.input?.addEventListener("change", () => this.onFileSelected());
      this.replace?.addEventListener("click", () => this.input?.click());
      document.addEventListener("submit", (event) => this.onProductSubmit(event), true);
      document.addEventListener("formdata", (event) => this.onFormData(event));
    }

    matchesProductForm(form) {
      if (!(form instanceof HTMLFormElement) || !form.action.includes("/cart/add")) return false;
      if (this.formSelector) {
        try {
          return form.matches(this.formSelector);
        } catch {
          return false;
        }
      }

      if (this.root.closest('form[action*="/cart/add"]') === form) return true;
      const productComponent = this.root.closest("product-component");
      if (productComponent?.contains(form)) return true;

      const section = this.root.closest(".shopify-section");
      if (section?.contains(form)) return true;

      const forms = document.querySelectorAll('form[action*="/cart/add"]');
      return forms.length === 1;
    }

    onProductSubmit(event) {
      const form = event.target;
      if (!this.matchesProductForm(form)) return;
      if (this.required && !this.jobId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.showError("Carga una fotografía antes de agregar este producto al carrito.");
        this.input?.focus();
        return;
      }
      this.syncHiddenProperty(form);
    }

    onFormData(event) {
      if (!this.jobId || !this.matchesProductForm(event.target)) return;
      event.formData.set(`properties[${JOB_PROPERTY}]`, this.jobId);
    }

    syncHiddenProperty(form) {
      if (!this.jobId) return;
      let hidden = form.querySelector(`input[data-customia3d-property="${this.productId}"]`);
      if (!hidden) {
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = `properties[${JOB_PROPERTY}]`;
        hidden.dataset.customia3dProperty = this.productId;
        form.appendChild(hidden);
      }
      hidden.value = this.jobId;
    }

    syncAllForms() {
      document.querySelectorAll('form[action*="/cart/add"]').forEach((form) => {
        if (this.matchesProductForm(form)) this.syncHiddenProperty(form);
      });
    }

    async onFileSelected() {
      const file = this.input?.files?.[0];
      if (!file) return;
      this.clearError();

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        this.showError("Usa una imagen JPG, PNG o WebP.");
        return;
      }
      if (file.size > this.maxBytes) {
        this.showError(`La fotografía supera el límite de ${Math.round(this.maxBytes / 1024 / 1024)} MB.`);
        return;
      }

      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = URL.createObjectURL(file);
      this.preview.src = this.objectUrl;
      this.fileName.textContent = file.name;
      this.selection.hidden = false;
      this.root.dataset.uploading = "true";
      this.status.textContent = "Guardando foto…";
      this.input.disabled = true;
      this.jobId = null;

      const formData = new FormData();
      formData.set("photo", file);
      formData.set("productId", this.productId);
      formData.set("productHandle", this.productHandle);

      try {
        const response = await fetch(`${this.proxyPath}/jobs`, {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "No pudimos guardar la fotografía.");

        this.jobId = result.jobId;
        this.status.textContent = "Foto lista para agregar al carrito";
        this.syncAllForms();
      } catch (error) {
        this.status.textContent = "No se guardó la foto";
        this.showError(error instanceof Error ? error.message : "No pudimos guardar la fotografía.");
      } finally {
        this.root.dataset.uploading = "false";
        this.input.disabled = false;
      }
    }

    showError(message) {
      this.error.textContent = message;
      this.error.hidden = false;
    }

    clearError() {
      this.error.textContent = "";
      this.error.hidden = true;
    }
  }

  function initialize(scope = document) {
    scope.querySelectorAll("[data-customia3d]").forEach((root) => {
      if (instances.has(root)) return;
      instances.add(root);
      new Customia3D(root);
    });
  }

  initialize();
  document.addEventListener("shopify:section:load", (event) => initialize(event.target));
})();
