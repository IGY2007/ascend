/**
 * Textos visibles de la app, en español.
 * Para sumar otro idioma: crear un archivo con la misma forma (tipo `Messages`) y elegirlo en i18n/index.ts.
 */
export const es = {
  app: {
    name: 'ASCEND',
    tagline: 'Build yourself. Track your progress.',
    skipSplash: 'Tocá para continuar',
  },
  common: {
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    save: 'Guardar',
    back: 'Volver',
    continue: 'Continuar',
    loading: 'Cargando…',
    retry: 'Reintentar',
    comingSoon: 'Próximamente',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    offline: 'Sin conexión',
  },
  nav: {
    home: 'Inicio',
    workouts: 'Entrenar',
    progress: 'Progreso',
    nutrition: 'Nutrición',
    profile: 'Perfil',
    main: 'Navegación principal',
  },
  auth: {
    loginTitle: 'Bienvenido de vuelta',
    loginSubtitle: 'Entrá para seguir con tu progreso.',
    signupTitle: 'Creá tu cuenta',
    signupSubtitle: 'Empezá a registrar tu entrenamiento hoy.',
    forgotTitle: 'Recuperar contraseña',
    forgotSubtitle: 'Te mandamos un mail con un link y un código para crear una contraseña nueva.',
    resetTitle: 'Nueva contraseña',
    resetSubtitle: 'Elegí una contraseña nueva para tu cuenta.',
    codeTitle: 'Revisá tu mail',
    codeSubtitle: (email: string) =>
      `Enviamos un mail a ${email}. Tocá el link o ingresá acá el código de 6 dígitos.`,
    displayName: 'Nombre',
    displayNamePlaceholder: 'Cómo querés que te llamemos',
    email: 'Email',
    emailPlaceholder: 'vos@ejemplo.com',
    password: 'Contraseña',
    newPassword: 'Contraseña nueva',
    passwordHint: 'Mínimo 8 caracteres.',
    code: 'Código del mail',
    login: 'Entrar',
    signup: 'Crear cuenta',
    sendLink: 'Enviar mail',
    savePassword: 'Guardar contraseña',
    forgotLink: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tenés cuenta?',
    haveAccount: '¿Ya tenés cuenta?',
    goSignup: 'Registrate',
    goLogin: 'Entrá',
    backToLogin: 'Volver a entrar',
    logout: 'Cerrar sesión',
    logoutConfirmTitle: '¿Cerrar sesión?',
    logoutConfirmBody: 'Vas a tener que volver a entrar con tu email y contraseña.',
    signupCheckEmail:
      'Te mandamos un mail para confirmar tu cuenta. Abrí el link y después entrá con tu email y contraseña.',
    passwordUpdated: 'Contraseña actualizada.',
    resetEmailSent: 'Mail enviado.',
    pwaNote:
      'Si abrís el link del mail en Safari y usás ASCEND desde la pantalla de inicio, conviene ingresar el código acá.',
    linkOpenedElsewhere:
      'El link se abrió en otro navegador. Ingresá el código del mail desde “¿Olvidaste tu contraseña?”.',
    errors: {
      invalidCredentials: 'Email o contraseña incorrectos.',
      emailNotConfirmed: 'Todavía no confirmaste tu email. Revisá tu casilla.',
      userExists: 'Ya existe una cuenta con ese email.',
      weakPassword: 'La contraseña es muy débil. Probá con una más larga.',
      rateLimit: 'Demasiados intentos. Esperá unos minutos y volvé a probar.',
      invalidCode: 'El código es incorrecto o venció. Pedí uno nuevo.',
      samePassword: 'La contraseña nueva tiene que ser distinta a la anterior.',
      network: 'No hay conexión. Revisá tu señal y volvé a intentar.',
      unknown: 'Algo salió mal. Volvé a intentar.',
    },
  },
  validation: {
    required: 'Este campo es obligatorio.',
    email: 'Ingresá un email válido.',
    passwordMin: 'La contraseña tiene que tener al menos 8 caracteres.',
    passwordMax: 'La contraseña es demasiado larga.',
    nameMax: 'Máximo 60 caracteres.',
    code: 'El código tiene 6 dígitos.',
  },
  home: {
    greeting: (name?: string | null) => (name ? `Hola, ${name}` : 'Hola'),
    emptyTitle: 'Tu progreso empieza acá',
    emptyBody:
      'Cuando armes tus rutinas y registres tu primer entrenamiento, vas a ver acá tu semana, tu próximo entrenamiento y el último que hiciste.',
  },
  workouts: {
    title: 'Entrenar',
    subtitle: 'Rutinas y entrenamiento',
    emptyTitle: 'Tus rutinas van a vivir acá',
    emptyBody:
      'Muy pronto vas a poder armar rutinas como Upper A / Lower A, asignarlas a días y registrar cada serie, incluso sin señal.',
  },
  progress: {
    title: 'Progreso',
    subtitle: 'Historial y récords',
    emptyTitle: 'Todavía no hay historial',
    emptyBody:
      'Cada entrenamiento que termines va a aparecer acá, con tus series, tu volumen y tus récords personales.',
  },
  profile: {
    title: 'Perfil',
    account: 'Cuenta',
    memberSince: (date: string) => `Desde ${date}`,
    version: (v: string) => `Versión ${v}`,
    offlineSession: 'Sin conexión: usando la sesión guardada en el dispositivo.',
  },
  pwa: {
    updateAvailable: 'Hay una versión nueva de ASCEND.',
    update: 'Actualizar',
    offlineReady: 'ASCEND ya funciona sin conexión.',
  },
  config: {
    title: 'Falta configurar Supabase',
    body: 'La app necesita estas variables de entorno para conectarse a la base de datos:',
    local: 'En local: copiá .env.example como .env.local, completalo y reiniciá npm run dev.',
    deploy:
      'En GitHub Pages: cargalas en Settings → Secrets and variables → Actions del repo y volvé a correr el deploy.',
    where: 'Los valores están en Supabase → Project Settings → API.',
  },
  notFound: {
    title: 'Esta pantalla no existe',
    action: 'Ir al inicio',
  },
  error: {
    title: 'Algo salió mal',
    body: 'Ocurrió un error inesperado. Tus datos guardados no se perdieron.',
    reload: 'Recargar',
  },
} as const

export type Messages = typeof es
