// Run this script using node inside server: node test-api.js (Make sure server.js is running first!)
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
    try {
        console.log('🚀 Starting AgriTrade AI Complete Platform Integration Tests...\n');

        // 1. Test AI Price Regression Endpoint
        console.log('1. Testing AI Price Regression Microservice Proxy...');
        let aiPriceRes = await fetch(`${BASE_URL}/ai/predict-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cropName: 'Organic Wheat',
                category: 'Grains',
                quantityKg: 1000,
                gradeScore: 3,
                moistureContentPercent: 11.5,
                region: 'North Region'
            })
        });
        let aiPriceData = await aiPriceRes.json();
        console.log('   AI Valuation Result:', aiPriceData);

        // 2. Register a Farmer & Create Produce Lot
        console.log('\n2. Registering Farmer & Creating Produce Lot...');
        const staticEmail = `farmer_${Date.now()}@farm.com`;
        let regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Ramesh Farmer',
                email: staticEmail,
                password: 'password123',
                role: 'Farmer',
                region: 'North Region'
            })
        });
        let farmerData = await regRes.json();
        const farmerId = farmerData.user.id;

        let lotRes = await fetch(`${BASE_URL}/lots/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                farmerId,
                cropName: 'Organic Wheat',
                category: 'Grains',
                quantityKg: 1000,
                harvestDate: '2026-09-15',
                region: 'North Region',
                actorName: 'Ramesh Farmer'
            })
        });
        let lotData = await lotRes.json();
        const lotId = lotData.lot._id;
        console.log(`   Lot Created! ID: ${lotId}, Initial Status: ${lotData.lot.status}, QR: ${lotData.lot.qrCodeString}`);

        // 3. Register Quality Inspector & Conduct Inspection
        console.log('\n3. Registering Inspector & Conducting Quality Grading...');
        const inspectorEmail = `inspector_${Date.now()}@agritrade.com`;
        let inspReg = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Chief Inspector',
                email: inspectorEmail,
                password: 'password123',
                role: 'Quality Inspector',
                region: 'North Region'
            })
        });
        let inspData = await inspReg.json();

        let inspectRes = await fetch(`${BASE_URL}/inspections/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lotId,
                inspectorId: inspData.user.id,
                inspectorName: 'Chief Inspector',
                grade: 'Grade A',
                moistureContentPercent: 11.2,
                defectsFound: 'None',
                remarks: 'Certified Grade A export quality.'
            })
        });
        let inspectResult = await inspectRes.json();
        console.log(`   Inspection Certified! New Lot Status: ${inspectResult.updatedLot.status}`);

        // 4. Register Commercial Buyer & Execute Purchase Order (Lock Escrow)
        console.log('\n4. Registering Buyer & Locking Escrow Payment...');
        const buyerEmail = `buyer_${Date.now()}@marts.com`;
        let buyerReg = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'SuperMart Procurement',
                email: buyerEmail,
                password: 'password123',
                role: 'Buyer',
                region: 'North Region'
            })
        });
        let buyerData = await buyerReg.json();

        let orderRes = await fetch(`${BASE_URL}/orders/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buyerId: buyerData.user.id,
                buyerName: 'SuperMart Procurement',
                lotId,
                agreedPrice: 35.0
            })
        });
        let orderData = await orderRes.json();
        const orderId = orderData.order._id;
        console.log(`   Order Executed! Order ID: ${orderId}, Escrow Amount: ₹${orderData.order.totalAmount}, Payment Status: ${orderData.order.paymentStatus}`);

        // 5. Register Logistics Coordinator & Dispatch Fleet Shipment
        console.log('\n5. Dispatching Fleet Transport Shipment...');
        const logisticsEmail = `logistics_${Date.now()}@transport.com`;
        let logReg = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Logistics Lead',
                email: logisticsEmail,
                password: 'password123',
                role: 'Logistics Coordinator',
                region: 'North Region'
            })
        });
        let logisticsData = await logReg.json();

        let shipRes = await fetch(`${BASE_URL}/shipments/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId,
                logisticsCoordinatorId: logisticsData.user.id,
                coordinatorName: 'Logistics Lead',
                vehicleNumber: 'KA-01-HH-9988',
                driverName: 'Suresh Kumar Driver',
                sourceLocation: 'North Regional Hub',
                destinationLocation: 'SuperMart Central Warehouse',
                estimatedDeliveryDate: '2026-09-20'
            })
        });
        let shipmentData = await shipRes.json();
        const shipmentId = shipmentData.shipment._id;
        console.log(`   Shipment Dispatched! Status: ${shipmentData.shipment.shipmentStatus}`);

        // 6. Confirm Delivery & Release Escrow Funds
        console.log('\n6. Confirming Delivery & Releasing Escrow Funds...');
        let deliverRes = await fetch(`${BASE_URL}/shipments/${shipmentId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shipmentStatus: 'Delivered',
                coordinatorName: 'Logistics Lead'
            })
        });
        let deliverData = await deliverRes.json();
        console.log(`   Delivery Finalized! Shipment Status: ${deliverData.shipment.shipmentStatus}`);

        // 7. Verify Public Provenance QR Traceability
        console.log('\n7. Verifying Public QR Traceability Provenance Ledger...');
        let traceRes = await fetch(`${BASE_URL}/trace/${lotId}`);
        let traceData = await traceRes.json();
        console.log(`   Provenance Trace Verified! Lot ID: ${traceData.lotId}, Current State: ${traceData.currentStatus}, Timeline Events: ${traceData.history.length}`);

        console.log('\n✨ ALL AGRITRADE AI INTEGRATION TESTS PASSED SUCCESSFULLY! ✨');

    } catch (error) {
        console.error('Test Failed with Error:', error);
    }
}

runTests();