const User = require('../models/UserModel');
const Lot = require('../models/LotModel');
const Order = require('../models/OrderModel');
const Inspection = require('../models/InspectionModel');
const Shipment = require('../models/ShipmentModel');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('ℹ️ Database already contains records. Skipping seed step.');
            return;
        }

        console.log('🌱 Database empty. Initializing MongoDB Compass Seed Data for AgriTrade AI...');

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Seed Users
        const users = await User.insertMany([
            {
                name: 'Ramesh Farmer',
                email: 'ramesh@farm.com',
                password: hashedPassword,
                role: 'Farmer',
                region: 'North Region'
            },
            {
                name: 'Suresh Agriculture',
                email: 'suresh@farm.com',
                password: hashedPassword,
                role: 'Farmer',
                region: 'South Region'
            },
            {
                name: 'Chief Inspector',
                email: 'inspector@agritrade.com',
                password: hashedPassword,
                role: 'Quality Inspector',
                region: 'North Region'
            },
            {
                name: 'SuperMart Procurement',
                email: 'buyer@marts.com',
                password: hashedPassword,
                role: 'Buyer',
                region: 'North Region'
            },
            {
                name: 'Logistics Lead',
                email: 'logistics@transport.com',
                password: hashedPassword,
                role: 'Logistics Coordinator',
                region: 'North Region'
            },
            {
                name: 'System Admin',
                email: 'admin@agritrade.com',
                password: hashedPassword,
                role: 'Platform Admin',
                region: 'North Region'
            }
        ]);

        const farmer1 = users.find(u => u.email === 'ramesh@farm.com');
        const farmer2 = users.find(u => u.email === 'suresh@farm.com');
        const inspector = users.find(u => u.email === 'inspector@agritrade.com');
        const buyer = users.find(u => u.email === 'buyer@marts.com');
        const logistics = users.find(u => u.email === 'logistics@transport.com');

        // 2. Seed Lots
        const lot1 = await Lot.create({
            farmerId: farmer1._id,
            cropName: 'Organic Wheat',
            category: 'Grains',
            quantityKg: 1000,
            harvestDate: new Date('2026-09-10'),
            region: 'North Region',
            status: 'ACCEPTED',
            qualityGrade: 'Grade A',
            qualityScore: 95,
            moistureContentPercent: 11.2,
            defectsFound: 'None',
            qrCodeString: 'LOT-172648001',
            history: [
                { stage: 'CREATED', timestamp: new Date('2026-09-10T08:00:00Z'), actorName: farmer1.name, actorRole: 'Farmer', notes: 'Harvest batch registered.' },
                { stage: 'INSPECTED', timestamp: new Date('2026-09-11T10:30:00Z'), actorName: inspector.name, actorRole: 'Quality Inspector', notes: 'Grade A certified.' }
            ]
        });

        const lot2 = await Lot.create({
            farmerId: farmer1._id,
            cropName: 'Basmati Rice',
            category: 'Grains',
            quantityKg: 2500,
            harvestDate: new Date('2026-09-12'),
            region: 'North Region',
            status: 'CREATED',
            qualityGrade: null,
            qualityScore: null,
            moistureContentPercent: 12.8,
            defectsFound: 'None',
            qrCodeString: 'LOT-172648002',
            history: [
                { stage: 'CREATED', timestamp: new Date('2026-09-12T09:15:00Z'), actorName: farmer1.name, actorRole: 'Farmer', notes: 'Harvest batch registered.' }
            ]
        });

        const lot3 = await Lot.create({
            farmerId: farmer2._id,
            cropName: 'Red Potatoes',
            category: 'Vegetables',
            quantityKg: 1500,
            harvestDate: new Date('2026-09-14'),
            region: 'South Region',
            status: 'STORED',
            qualityGrade: 'Grade B',
            qualityScore: 82,
            moistureContentPercent: 13.5,
            defectsFound: 'Minor surface skinning',
            qrCodeString: 'LOT-172648003',
            history: [
                { stage: 'CREATED', timestamp: new Date('2026-09-14T07:30:00Z'), actorName: farmer2.name, actorRole: 'Farmer', notes: 'Harvest batch registered.' },
                { stage: 'INSPECTED', timestamp: new Date('2026-09-14T14:20:00Z'), actorName: inspector.name, actorRole: 'Quality Inspector', notes: 'Grade B certified.' }
            ]
        });

        // 3. Seed Inspection
        await Inspection.create({
            lotId: lot1._id,
            inspectorId: inspector._id,
            grade: 'Grade A',
            moistureContentPercent: 11.2,
            defectsFound: 'None',
            remarks: 'High purity level, optimal moisture content.',
            inspectionDate: new Date('2026-09-11T10:30:00Z')
        });

        // 4. Seed Orders (Active & Past Escrow)
        const order1 = await Order.create({
            buyerId: buyer._id,
            lotId: lot1._id,
            agreedPrice: 35.0,
            totalAmount: 35000,
            orderStatus: 'Dispatched',
            paymentStatus: 'Escrow Held'
        });

        const order2 = await Order.create({
            buyerId: buyer._id,
            lotId: lot3._id,
            agreedPrice: 18.5,
            totalAmount: 27750,
            orderStatus: 'Delivered',
            paymentStatus: 'Paid'
        });

        // 5. Seed Shipment
        await Shipment.create({
            orderId: order1._id,
            logisticsCoordinatorId: logistics._id,
            vehicleNumber: 'KA-01-HH-9988',
            driverName: 'Suresh Kumar Driver',
            sourceLocation: 'North Collection Hub',
            destinationLocation: 'SuperMart Central Warehouse',
            shipmentStatus: 'Dispatched',
            estimatedDeliveryDate: new Date('2026-09-28'),
            telemetry: {
                temperatureC: 21.4,
                humidityPercent: 55.0,
                gpsCoordinates: '17.3850° N, 78.4867° E'
            }
        });


        console.log('✅ MongoDB Compass Seed Data Initialized Successfully!');
    } catch (err) {
        console.error('❌ Database Seeding Failed:', err.message);
    }
};

module.exports = seedDatabase;
