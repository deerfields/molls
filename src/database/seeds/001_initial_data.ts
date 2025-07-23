import { DataSource } from 'typeorm'
import { User, UserRole, UserStatus, UserType } from '@/models/User'
import { Mall, MallType, MallClass, MallStatus } from '@/models/Mall'
import { Tenant, TenantType, TenantCategory, TenantStatus } from '@/models/Tenant'
import { WorkPermit, WorkPermitType, WorkPermitStatus, RiskLevel, WorkCategory } from '@/models/WorkPermit'
import bcrypt from 'bcryptjs'
import { config } from '@/config/config'

export class InitialData1700000000001 {
  public async up(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User)
    const mallRepository = dataSource.getRepository(Mall)
    const tenantRepository = dataSource.getRepository(Tenant)
    const workPermitRepository = dataSource.getRepository(WorkPermit)

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', config.auth.bcryptRounds)
    const adminUser = userRepository.create({
      firstName: 'System',
      lastName: 'Administrator',
      username: 'admin',
      email: 'admin@mallos.com',
      phoneNumber: '+971501234567',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      type: UserType.REGULAR,
      emailVerifiedAt: new Date(),
      profile: {
        avatar: null,
        bio: 'System Administrator',
        preferences: {
          language: 'en',
          timezone: 'Asia/Dubai',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      },
      permissions: {
        users: ['read', 'write', 'delete'],
        tenants: ['read', 'write', 'delete'],
        malls: ['read', 'write', 'delete'],
        workPermits: ['read', 'write', 'delete'],
        reports: ['read', 'write'],
        settings: ['read', 'write']
      },
      settings: {
        theme: 'light',
        dashboard: {
          layout: 'default',
          widgets: ['overview', 'recent_activities', 'quick_actions']
        }
      }
    })
    await userRepository.save(adminUser)

    // Create mall manager
    const managerPassword = await bcrypt.hash('manager123', config.auth.bcryptRounds)
    const managerUser = userRepository.create({
      firstName: 'Mall',
      lastName: 'Manager',
      username: 'manager',
      email: 'manager@mallos.com',
      phoneNumber: '+971502345678',
      password: managerPassword,
      role: UserRole.MALL_MANAGER,
      status: UserStatus.ACTIVE,
      type: UserType.REGULAR,
      emailVerifiedAt: new Date(),
      profile: {
        avatar: null,
        bio: 'Mall Operations Manager',
        preferences: {
          language: 'en',
          timezone: 'Asia/Dubai',
          notifications: {
            email: true,
            sms: true,
            push: true
          }
        }
      },
      permissions: {
        users: ['read'],
        tenants: ['read', 'write'],
        malls: ['read', 'write'],
        workPermits: ['read', 'write'],
        reports: ['read'],
        settings: ['read']
      }
    })
    await userRepository.save(managerUser)

    // Create sample mall
    const mall = mallRepository.create({
      mallCode: 'MALL-001',
      name: 'Dubai Mall Plaza',
      tradingName: 'Dubai Mall Plaza',
      type: MallType.SHOPPING_CENTER,
      class: MallClass.PREMIUM,
      status: MallStatus.ACTIVE,
      location: {
        address: 'Sheikh Mohammed Bin Rashid Boulevard',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        postalCode: '00000',
        coordinates: {
          latitude: 25.197197,
          longitude: 55.274376
        }
      },
      contact: {
        email: 'info@dubaimallplaza.com',
        phone: '+97142234567',
        fax: '+97142234568',
        website: 'https://dubaimallplaza.com'
      },
      facilityDetails: {
        totalArea: 500000, // sq ft
        retailArea: 350000,
        parkingSpaces: 2000,
        floors: 3,
        escalators: 25,
        elevators: 15
      },
      operatingHours: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '22:00' }
      },
      amenities: [
        'Food Court',
        'Prayer Room',
        'ATM',
        'Information Desk',
        'First Aid',
        'Lost & Found',
        'Valet Parking',
        'WiFi'
      ],
      tenantMix: {
        retail: 60,
        foodAndBeverage: 25,
        entertainment: 10,
        services: 5
      },
      financial: {
        annualRevenue: 500000000,
        averageRent: 150,
        occupancyRate: 95
      },
      performance: {
        footTraffic: {
          daily: 50000,
          monthly: 1500000,
          yearly: 18000000
        },
        sales: {
          daily: 5000000,
          monthly: 150000000,
          yearly: 1800000000
        }
      },
      marketing: {
        socialMedia: {
          instagram: '@dubaimallplaza',
          facebook: 'dubaimallplaza',
          twitter: '@dubaimallplaza'
        },
        events: ['Seasonal Sales', 'Fashion Shows', 'Food Festivals']
      },
      compliance: {
        fireSafety: 'Compliant',
        healthSafety: 'Compliant',
        accessibility: 'Compliant',
        lastInspection: '2024-01-15'
      },
      maintenance: {
        scheduledMaintenance: true,
        emergencyContacts: {
          electrical: '+971501234567',
          plumbing: '+971502345678',
          hvac: '+971503456789'
        }
      },
      security: {
        cctvCameras: 150,
        securityPersonnel: 25,
        accessControl: true,
        emergencyResponse: '5 minutes'
      },
      technology: {
        wifi: true,
        digitalSignage: true,
        smartParking: true,
        mobileApp: true
      },
      sustainability: {
        solarPanels: true,
        energyEfficient: true,
        wasteRecycling: true,
        greenCertification: 'LEED Gold'
      },
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingAids: true,
        serviceAnimals: true
      },
      settings: {
        timezone: 'Asia/Dubai',
        currency: 'AED',
        language: 'en',
        dateFormat: 'DD/MM/YYYY'
      }
    })
    await mallRepository.save(mall)

    // Create sample tenants
    const tenants = [
      {
        tenantCode: 'TNT-001',
        businessName: 'Fashion Forward',
        tradingName: 'Fashion Forward',
        type: TenantType.RETAIL,
        category: TenantCategory.FASHION,
        status: TenantStatus.ACTIVE,
        contactEmail: 'info@fashionforward.com',
        contactPhone: '+971501234567',
        contactPerson: 'Ahmed Al Mansouri',
        address: {
          unit: 'A-101',
          floor: '1',
          area: 1500
        },
        businessDetails: {
          brand: 'Fashion Forward',
          products: ['Clothing', 'Accessories', 'Footwear'],
          targetMarket: 'Young Adults',
          priceRange: 'Mid-Range'
        },
        leaseDetails: {
          startDate: '2023-01-01',
          endDate: '2025-12-31',
          rent: 15000,
          deposit: 30000,
          utilities: 'Included'
        },
        financialInfo: {
          monthlySales: 50000,
          annualRevenue: 600000,
          profitMargin: 25
        },
        spaceDetails: {
          area: 1500,
          frontage: 20,
          storage: 200
        }
      },
      {
        tenantCode: 'TNT-002',
        businessName: 'Café Delight',
        tradingName: 'Café Delight',
        type: TenantType.F_B,
        category: TenantCategory.FOOD,
        status: TenantStatus.ACTIVE,
        contactEmail: 'info@cafedelight.com',
        contactPhone: '+971502345678',
        contactPerson: 'Sarah Johnson',
        address: {
          unit: 'B-205',
          floor: '2',
          area: 800
        },
        businessDetails: {
          brand: 'Café Delight',
          products: ['Coffee', 'Pastries', 'Light Meals'],
          targetMarket: 'All Ages',
          priceRange: 'Affordable'
        },
        leaseDetails: {
          startDate: '2023-03-01',
          endDate: '2026-02-28',
          rent: 12000,
          deposit: 24000,
          utilities: 'Separate'
        },
        financialInfo: {
          monthlySales: 35000,
          annualRevenue: 420000,
          profitMargin: 30
        },
        spaceDetails: {
          area: 800,
          frontage: 15,
          storage: 100
        }
      },
      {
        tenantCode: 'TNT-003',
        businessName: 'Tech Solutions',
        tradingName: 'Tech Solutions',
        type: TenantType.SERVICE,
        category: TenantCategory.SERVICE,
        status: TenantStatus.PENDING_APPROVAL,
        contactEmail: 'info@techsolutions.com',
        contactPhone: '+971503456789',
        contactPerson: 'Mohammed Ali',
        address: {
          unit: 'C-301',
          floor: '3',
          area: 600
        },
        businessDetails: {
          brand: 'Tech Solutions',
          products: ['IT Services', 'Repairs', 'Consulting'],
          targetMarket: 'Business & Individuals',
          priceRange: 'Variable'
        },
        leaseDetails: {
          startDate: '2024-02-01',
          endDate: '2027-01-31',
          rent: 8000,
          deposit: 16000,
          utilities: 'Included'
        },
        financialInfo: {
          monthlySales: 25000,
          annualRevenue: 300000,
          profitMargin: 40
        },
        spaceDetails: {
          area: 600,
          frontage: 12,
          storage: 150
        }
      }
    ]

    for (const tenantData of tenants) {
      const tenant = tenantRepository.create({
        ...tenantData,
        mallId: mall.id,
        compliance: {
          tradeLicense: 'Valid',
          insurance: 'Valid',
          fireSafety: 'Compliant',
          lastInspection: '2024-01-10'
        },
        services: {
          delivery: true,
          installation: true,
          maintenance: true,
          support: true
        },
        marketing: {
          socialMedia: true,
          promotions: true,
          events: true,
          loyaltyProgram: true
        },
        performance: {
          footTraffic: 500,
          conversionRate: 15,
          averageTransaction: 150,
          customerSatisfaction: 4.5
        },
        settings: {
          notifications: true,
          reports: true,
          analytics: true
        }
      })
      await tenantRepository.save(tenant)
    }

    // Create sample work permits
    const workPermits = [
      {
        permitNumber: 'WP-2024-001',
        tenantId: (await tenantRepository.findOne({ where: { tenantCode: 'TNT-001' } }))!.id,
        mallId: mall.id,
        type: WorkPermitType.GENERAL,
        status: WorkPermitStatus.APPROVED,
        riskLevel: RiskLevel.LOW,
        category: WorkCategory.DECORATION,
        workDescription: 'Store renovation and decoration work',
        detailedDescription: 'Complete interior renovation including painting, flooring, and fixture installation',
        location: {
          unit: 'A-101',
          floor: '1',
          area: 'Store interior'
        },
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-15'),
        workSchedule: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        },
        personnel: [
          {
            name: 'Ahmed Hassan',
            role: 'Foreman',
            contact: '+971501234567',
            experience: '5 years'
          },
          {
            name: 'Mohammed Ali',
            role: 'Painter',
            contact: '+971502345678',
            experience: '3 years'
          }
        ],
        equipment: [
          'Paint brushes and rollers',
          'Ladders',
          'Power tools',
          'Safety equipment'
        ],
        safetyMeasures: [
          'Safety barriers',
          'Warning signs',
          'Personal protective equipment',
          'Fire extinguishers'
        ],
        riskAssessment: {
          hazards: ['Falling from height', 'Chemical exposure'],
          controls: ['Use of ladders', 'Proper ventilation'],
          emergencyProcedures: 'Contact mall security immediately'
        },
        methodStatement: {
          preparation: 'Clear area and set up safety barriers',
          execution: 'Follow safety protocols and manufacturer instructions',
          completion: 'Clean up area and remove barriers'
        },
        approvals: [
          {
            role: 'Mall Manager',
            name: 'Mall Manager',
            date: '2024-01-25',
            status: 'Approved'
          }
        ],
        costs: {
          materials: 5000,
          labor: 8000,
          total: 13000
        }
      },
      {
        permitNumber: 'WP-2024-002',
        tenantId: (await tenantRepository.findOne({ where: { tenantCode: 'TNT-002' } }))!.id,
        mallId: mall.id,
        type: WorkPermitType.HOT_WORK,
        status: WorkPermitStatus.PENDING_APPROVAL,
        riskLevel: RiskLevel.HIGH,
        category: WorkCategory.ELECTRICAL,
        workDescription: 'Electrical system upgrade and maintenance',
        detailedDescription: 'Upgrade electrical panel and install new lighting system',
        location: {
          unit: 'B-205',
          floor: '2',
          area: 'Kitchen and dining area'
        },
        startDate: new Date('2024-02-20'),
        endDate: new Date('2024-02-25'),
        workSchedule: {
          monday: { start: '22:00', end: '06:00' },
          tuesday: { start: '22:00', end: '06:00' },
          wednesday: { start: '22:00', end: '06:00' }
        },
        personnel: [
          {
            name: 'Omar Khalil',
            role: 'Electrician',
            contact: '+971503456789',
            experience: '8 years',
            license: 'UAE Electrical License'
          }
        ],
        equipment: [
          'Electrical tools',
          'Testing equipment',
          'Safety gear',
          'Fire watch equipment'
        ],
        safetyMeasures: [
          'Fire watch during hot work',
          'Proper ventilation',
          'Fire extinguishers on site',
          'Emergency shutdown procedures'
        ],
        riskAssessment: {
          hazards: ['Electrical shock', 'Fire', 'Arc flash'],
          controls: ['Lockout/tagout', 'Fire watch', 'Proper PPE'],
          emergencyProcedures: 'Immediate shutdown and evacuation'
        },
        methodStatement: {
          preparation: 'Isolate power and set up fire watch',
          execution: 'Follow electrical safety standards',
          completion: 'Test systems and restore power'
        },
        costs: {
          materials: 3000,
          labor: 5000,
          total: 8000
        }
      }
    ]

    for (const permitData of workPermits) {
      const workPermit = workPermitRepository.create(permitData)
      await workPermitRepository.save(workPermit)
    }

    // Create tenant user
    const tenantPassword = await bcrypt.hash('tenant123', config.auth.bcryptRounds)
    const tenantUser = userRepository.create({
      firstName: 'Tenant',
      lastName: 'User',
      username: 'tenant',
      email: 'tenant@mallos.com',
      phoneNumber: '+971504567890',
      password: tenantPassword,
      role: UserRole.TENANT_USER,
      status: UserStatus.ACTIVE,
      type: UserType.REGULAR,
      tenantId: (await tenantRepository.findOne({ where: { tenantCode: 'TNT-001' } }))!.id,
      emailVerifiedAt: new Date(),
      profile: {
        avatar: null,
        bio: 'Fashion Forward Store Manager',
        preferences: {
          language: 'en',
          timezone: 'Asia/Dubai',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      },
      permissions: {
        workPermits: ['read', 'write'],
        reports: ['read'],
        profile: ['read', 'write']
      }
    })
    await userRepository.save(tenantUser)
  }

  public async down(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User)
    const mallRepository = dataSource.getRepository(Mall)
    const tenantRepository = dataSource.getRepository(Tenant)
    const workPermitRepository = dataSource.getRepository(WorkPermit)

    await workPermitRepository.delete({})
    await tenantRepository.delete({})
    await mallRepository.delete({})
    await userRepository.delete({})
  }
} 