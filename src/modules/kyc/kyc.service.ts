import prisma from '../database/prisma.js';

export class KycService {
  async getKycStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, kycStatus: true, limit: true }
    });
    return user;
  }

  // Simulate External API Call for NIN/BVN Verification
  private async simulateExternalVerification(type: 'BVN' | 'NIN', value: string) {
    // In a real production app, this would use Axios to call Paystack or SmileIdentity
    // e.g. await axios.get(`https://api.paystack.co/bank/resolve_bvn/${value}`)
    
    // Simulate network delay
    await new Promise(res => setTimeout(res, 1500));
    
    if (value.startsWith('000')) {
      throw new Error(`Invalid ${type} format. Simulating external API rejection.`);
    }
    
    return {
      success: true,
      message: `${type} verified successfully via simulated external provider.`
    };
  }

  async upgradeTier1(userId: string, data: any) {
    // Tier 1: Basic info
    const fullName = `${data.firstName} ${data.lastName}`;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        phone: data.phone,
        tier: 'Tier 1',
        limit: 50000,
        kycStatus: 'Verified (Level 1)'
      }
    });
    
    return { success: true, tier: user.tier, limit: user.limit, message: 'Tier 1 KYC Successful' };
  }

  async upgradeTier2(userId: string, data: any) {
    // Tier 2 requires verifying BVN or NIN
    const type = data.bvn ? 'BVN' : 'NIN';
    const value = data.bvn || data.nin;

    // Call external API mock
    await this.simulateExternalVerification(type, value);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        tier: 'Tier 2',
        limit: 500000,
        kycStatus: 'Verified (Level 2)'
      }
    });

    return { success: true, tier: user.tier, limit: user.limit, message: 'Tier 2 KYC Successful' };
  }

  async upgradeTier3(userId: string, data: any) {
    // Tier 3 requires Proof of Address
    // Simulate image AI verification / OCR
    await new Promise(res => setTimeout(res, 2000));

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        tier: 'Tier 3',
        limit: 5000000,
        kycStatus: 'Verified (Level 3)'
      }
    });

    return { success: true, tier: user.tier, limit: user.limit, message: 'Tier 3 KYC Successful' };
  }
}

export const kycService = new KycService();
