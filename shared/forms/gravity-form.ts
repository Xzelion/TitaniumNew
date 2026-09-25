/** Modeled Gravity Forms export. Public submit stays off until a person turns it on. */

export const FORM_WIRING = {
  publicSubmit: false,
  hcaptcha: 'needs_keys',
  notifications: 'needs_keys',
  fileUpload: 'not_wired',
} as const

export type FormWiring = {
  publicSubmit: false
  hcaptcha: 'needs_keys' | 'not_in_export'
  notifications: 'needs_keys'
  fileUpload: 'not_wired' | 'not_in_export'
}

export interface GravityChoice {
  text: string
  value: string
}

export interface GravityRule {
  fieldId: number
  operator: string
  value: string
}

export interface GravityConditional {
  actionType: string
  logicType: string
  rules: GravityRule[]
}

export interface GravityFieldModel {
  id: number
  type: string
  label: string
  required: boolean
  choices: GravityChoice[]
  conditionalLogic: GravityConditional | null
  multipleFiles: boolean
}

export interface GravityRoute {
  fieldId: number
  operator: string
  value: string
  email: string
}

export interface GravityNotificationModel {
  id: string
  name: string
  active: boolean
  toType: string
  to: string
  from: string
  subject: string
  routing: GravityRoute[]
  /** Delivery is recorded from the export and is not sent. */
  send: false
  delivery: 'needs_keys'
}

export interface GravityConfirmationModel {
  id: string
  name: string
  type: string
  message: string
}

export interface GravityFormModel {
  id: number
  title: string
  version: string
  submitLabel: string
  publicSubmit: false
  wiring: FormWiring
  fields: GravityFieldModel[]
  confirmation: GravityConfirmationModel
  notifications: GravityNotificationModel[]
}

export interface KnownFormNote {
  formId: number
  hashToken: string
  label: string
  reason: string
}

export function modelGravityFormExport(data: unknown, formId = 20): GravityFormModel {
  const form = findForm(data, formId)
  const fields = asArray(form.fields).map(modelField)
  const confirmations = asArray(form.confirmations)
  const confirmation = confirmations[0]
  if (!confirmation) throw new Error(`Form ${formId} has no confirmation`)
  const hasCaptcha = fields.some((field) => field.type === 'hcaptcha')
  const hasUpload = fields.some((field) => field.type === 'fileupload')
  const wiring: FormWiring = {
    publicSubmit: false,
    hcaptcha: hasCaptcha ? 'needs_keys' : 'not_in_export',
    notifications: 'needs_keys',
    fileUpload: hasUpload ? 'not_wired' : 'not_in_export',
  }
  return {
    id: asNumber(form.id),
    title: asString(form.title),
    version: asString(form.version),
    submitLabel: buttonLabel(form.button),
    publicSubmit: false,
    wiring,
    fields,
    confirmation: {
      id: asString(confirmation.id),
      name: asString(confirmation.name),
      type: asString(confirmation.type),
      message: asString(confirmation.message),
    },
    notifications: asArray(form.notifications).map(modelNotification),
  }
}

export function formNoteFromModel(model: GravityFormModel): KnownFormNote {
  const captcha =
    model.wiring.hcaptcha === 'needs_keys'
      ? 'hCaptcha and notification delivery need keys before anyone can send it.'
      : 'The export has no hCaptcha field. Notification delivery needs keys before anyone can send it.'
  const upload = model.wiring.fileUpload === 'not_wired' ? ' The file upload is not wired.' : ''
  return {
    formId: model.id,
    hashToken: `gf${model.id}-nosubmit`,
    label: `Gravity Form ${model.id}`,
    reason: `Form ${model.id}, ${model.title}, is modeled from the WordPress export (${model.fields.length} fields, ${model.notifications.length} notifications, 1 confirmation). Public submit is off. ${captcha}${upload}`,
  }
}

function findForm(data: unknown, formId: number): Record<string, unknown> {
  if (!isRecord(data)) throw new Error('Gravity Form export is not an object')
  if (asNumber(data.id) === formId) return data
  for (const value of Object.values(data)) {
    if (isRecord(value) && asNumber(value.id) === formId) return value
  }
  throw new Error(`Gravity Form ${formId} is not in this export`)
}

function modelField(value: Record<string, unknown>): GravityFieldModel {
  const choices = asArray(value.choices)
    .map((choice) => ({ text: asString(choice.text), value: asString(choice.value) }))
    .filter((choice) => choice.text.length > 0 || choice.value.length > 0)
  return {
    id: asNumber(value.id),
    type: asString(value.type),
    label: asString(value.label),
    required: value.isRequired === true || value.isRequired === '1' || value.isRequired === 1,
    choices,
    conditionalLogic: modelConditional(value.conditionalLogic),
    multipleFiles: value.multipleFiles === true,
  }
}

function modelConditional(value: unknown): GravityConditional | null {
  if (!isRecord(value)) return null
  const rules = asArray(value.rules).map((rule) => ({
    fieldId: asNumber(rule.fieldId),
    operator: asString(rule.operator),
    value: asString(rule.value),
  }))
  if (rules.length === 0) return null
  return {
    actionType: asString(value.actionType),
    logicType: asString(value.logicType),
    rules,
  }
}

function modelNotification(value: Record<string, unknown>): GravityNotificationModel {
  return {
    id: asString(value.id),
    name: asString(value.name),
    active: value.isActive !== false && value.isActive !== '0',
    toType: asString(value.toType),
    to: asString(value.to),
    from: asString(value.from),
    subject: asString(value.subject),
    routing: asArray(value.routing).map((route) => ({
      fieldId: asNumber(route.fieldId),
      operator: asString(route.operator),
      value: asString(route.value),
      email: asString(route.email),
    })),
    send: false,
    delivery: 'needs_keys',
  }
}

function buttonLabel(value: unknown): string {
  if (!isRecord(value)) return 'Submit'
  const text = asString(value.text)
  return text || 'Submit'
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord)
  if (isRecord(value)) return Object.values(value).filter(isRecord)
  return []
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function asNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
