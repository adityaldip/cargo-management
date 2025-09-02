export interface RateRule {
  id: string
  name: string
  route?: string
  customer?: string
  mailCategory?: string
  mailClass?: string
  euromail?: "EU" | "NONEU"
  ratePerKg: number
  minimumCharge: number
  currency: string
  validFrom: string
  validTo?: string
  active: boolean
}

export interface RateSettings {
  defaultCurrency: string
  vatRate: number
  roundingPrecision: number
  applyVAT: boolean
  rules: RateRule[]
}

export const defaultRateSettings: RateSettings = {
  defaultCurrency: "EUR",
  vatRate: 21,
  roundingPrecision: 2,
  applyVAT: true,
  rules: [
    {
      id: "default-eu",
      name: "Default EU Rate",
      euromail: "EU",
      ratePerKg: 2.5,
      minimumCharge: 5.0,
      currency: "EUR",
      validFrom: "2023-01-01",
      active: true,
    },
    {
      id: "default-noneu",
      name: "Default Non-EU Rate",
      euromail: "NONEU",
      ratePerKg: 3.75,
      minimumCharge: 7.5,
      currency: "EUR",
      validFrom: "2023-01-01",
      active: true,
    },
    {
      id: "usfrat-usrixt-premium",
      name: "USFRAT → USRIXT Premium",
      route: "USFRAT-USRIXT",
      mailCategory: "A",
      ratePerKg: 4.2,
      minimumCharge: 8.0,
      currency: "EUR",
      validFrom: "2023-01-01",
      active: true,
    },
  ],
}
