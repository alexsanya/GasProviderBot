import { privateKeyToAccount } from 'viem/accounts'

const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY
export const account = privateKeyToAccount(PRIVATE_KEY)

export const PORT = 8080
export const MIN_DEADLINE = 1698709687
export const PROFIT_FACTOR = 2
export const NETWORK_ID = 137
export const ACCOUNT_ADDRESS_REGEX = /(0x[a-fA-F0-9]{40})/g
export const SIGNATURE_REGEX = /(0x[a-fA-F0-9]{130})/g
export const GAS_BROKER_ADDRESS = "0x92f1C3d951018C90C364c234ff5fEE00f334072F"
export const CHAINLINK_MATIC_USD_FEED="0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"

