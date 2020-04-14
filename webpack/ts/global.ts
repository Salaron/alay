// Disable typechecking for this file
// @ts-nocheck

// This variables will be declared in Pug templates
// common
export const userId: number = window.userId
export const authToken: string = window.authToken
export const isWebview: boolean = window.isWebview
export const isAdmin: boolean = window.isAdmin
export const headers: any = window.headers
export const i18n: any = window.i18n

// login
export const enableRecaptcha: boolean = window.enableRecaptcha
export const publicKey: string = window.publicKey
export const recaptchaSiteKey: string = window.recaptchaSiteKey
export const grecaptcha: any = window.grecaptcha // tooooo lazy to do typings