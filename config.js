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
export const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
export const USDC_DECIMALS_RATIO = 10n**6n
export const USDC_TRESHOLD = 5n
export const OPERATIONAL_BALANCE = 10n * 10n**18n
export const GAS_TRESHOLD = 2n * OPERATIONAL_BALANCE
export const COLD_WALLET_ADDRESS = "0x4a89caAE3daf3Ec08823479dD2389cE34f0E6c96"
export const GAS_PROVIDER_HELPER_ADDRESS = "0x9478f3aF12b34e244854916A6aeBbE0AE83282B0"
export const UNISWAP_USDC_WMATIC_POOL_ADDRESS = "0xA374094527e1673A86dE625aa59517c5dE346d32"
export const GAS_LIMIT = 500000n
export const BROADCAST_SERVER_URL = "http://localhost:8085"
