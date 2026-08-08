export const NUBAN_BANKS: Record<string, { name: string; sortCode: string }> = {
  '011': { name: 'First Bank', sortCode: '011151583' },
  '044': { name: 'Access Bank', sortCode: '044150155' },
  '058': { name: 'GTBank', sortCode: '058152014' },
  '033': { name: 'UBA', sortCode: '033153522' },
  '057': { name: 'Zenith Bank', sortCode: '057152413' },
  '032': { name: 'Union Bank', sortCode: '032152712' },
  '070': { name: 'Fidelity Bank', sortCode: '070153047' },
  '221': { name: 'Stanbic IBTC', sortCode: '221153053' },
  '232': { name: 'Sterling Bank', sortCode: '232153319' },
  '214': { name: 'FCMB', sortCode: '214154118' },
  '050': { name: 'Ecobank', sortCode: '050153242' },
  '035': { name: 'Wema Bank', sortCode: '035153085' },
  '215': { name: 'Unity Bank', sortCode: '215153559' },
  '301': { name: 'Jaiz Bank', sortCode: '301153648' },
  '076': { name: 'Polaris Bank', sortCode: '076152832' },
  '101': { name: 'Providus Bank', sortCode: '101153839' },
  '082': { name: 'Keystone Bank', sortCode: '082153155' },
  '068': { name: 'Standard Chartered', sortCode: '068153857' },
  '030': { name: 'Heritage Bank', sortCode: '030153118' },
  '023': { name: 'Citibank', sortCode: '023152792' },
  '090': { name: 'Opay', sortCode: '090175001' },
  '502': { name: 'Kuda', sortCode: '502111475' },
}

export interface StructuredAddress {
  houseNumber: string
  streetName: string
  city: string
  state: string
}

export const parseAddress = (addr: string | null | undefined): StructuredAddress => {
  if (!addr) return { houseNumber: '', streetName: '', city: '', state: '' }
  const [line1 = '', city = '', state = ''] = addr.split(',').map((s) => s.trim())
  const parts = line1.split(/\s+/).filter(Boolean)
  const houseNumber = /^\d+/.test(parts[0] || '') ? parts[0] : ''
  const streetName = parts.slice(houseNumber ? 1 : 0).join(' ')
  return { houseNumber, streetName, city, state }
}

export const composeAddress = (a: StructuredAddress): string =>
  [a.houseNumber && a.streetName ? `${a.houseNumber} ${a.streetName}` : (a.houseNumber || a.streetName), a.city, a.state]
    .filter(Boolean)
    .join(', ')
