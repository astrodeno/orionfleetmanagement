 // Supabase configuration
        const SUPABASE_URL = 'https://ozbgaobhvgqeofecxrku.supabase.co';
        const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96Ymdhb2JodmdxZW9mZWN4cmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTk2NDIsImV4cCI6MjA2OTUzNTY0Mn0.ctl8sBukpXRAjjqIXPNEndlK73dMfLUO4g1vUZn-OJE';

        // Initialize Supabase client
        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_API_KEY);

        // Application state and data management with Supabase integration
        class FleetProApp {
            constructor() {
                this.data = {
                    operations: [],
                    vehicles: [],
                    drivers: [],
                    materials: [],
                    routes: [],
                    expenses: [],
                    maintenance: [],
                    insurance: [],
                    attendance: [],
                    fuel: [],
                    settings: {
                        companyName: 'FleetPro Trucking',
                        currency: 'KSh',
                        dateFormat: 'DD/MM/YYYY'
                    }
                };
                
                this.charts = {};
                this.isLoading = false;
                this.init();
            }
            
            async init() {
                try {
                    this.setupEventListeners();
                    await this.testSupabaseConnection();
                    await this.loadAllData();
                    this.initCharts();
                    this.updateDashboard();
                    
                    // Set today's date for attendance
                    document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
                } catch (error) {
                    console.error('Initialization error:', error);
                    this.showNotification('Failed to initialize application', 'error');
                }
            }

            async testSupabaseConnection() {
                try {
                    const { data, error } = await supabaseClient.from('vehicles').select('count').limit(1);
                    if (error) {
                        throw error;
                    }
                    document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-wifi"></i> Connected';
                    document.getElementById('connectionStatus').className = 'status-badge badge-online';
                    document.getElementById('supabaseStatus').textContent = 'Connected';
                    this.showNotification('Successfully connected to Supabase', 'success');
                } catch (error) {
                    console.error('Supabase connection error:', error);
                    document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
                    document.getElementById('connectionStatus').className = 'status-badge badge-offline';
                    document.getElementById('supabaseStatus').textContent = 'Disconnected';
                    this.showNotification('Failed to connect to database', 'error');
                }
            }

            // SUPABASE DATA OPERATIONS

            // Fetch data from Supabase
            async fetchData(table, filters = {}) {
                try {
                    let query = supabaseClient.from(table).select('*');
                    
                    // Apply filters
                    Object.keys(filters).forEach(key => {
                        query = query.eq(key, filters[key]);
                    });

                    const { data, error } = await query.order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    return data || [];
                } catch (error) {
                    console.error(`Error fetching ${table}:`, error);
                    this.showNotification(`Failed to load ${table}`, 'error');
                    return [];
                }
            }

            // Insert data into Supabase
            async insertData(table, data) {
                try {
                    const { data: result, error } = await supabaseClient
                        .from(table)
                        .insert(data)
                        .select();
                    
                    if (error) throw error;
                    return result[0];
                } catch (error) {
                    console.error(`Error inserting into ${table}:`, error);
                    this.showNotification(`Failed to save ${table}`, 'error');
                    throw error;
                }
            }

            // Update data in Supabase
            async updateData(table, id, data) {
                try {
                    const { data: result, error } = await supabaseClient
                        .from(table)
                        .update(data)
                        .eq('id', id)
                        .select();
                    
                    if (error) throw error;
                    return result[0];
                } catch (error) {
                    console.error(`Error updating ${table}:`, error);
                    this.showNotification(`Failed to update ${table}`, 'error');
                    throw error;
                }
            }

            // Upsert data in Supabase
            async upsertData(table, data) {
                try {
                    const { data: result, error } = await supabaseClient
                        .from(table)
                        .upsert(data)
                        .select();
                    
                    if (error) throw error;
                    return result[0];
                } catch (error) {
                    console.error(`Error upserting ${table}:`, error);
                    this.showNotification(`Failed to upsert ${table}`, 'error');
                    throw error;
                }
            }

            // Delete data from Supabase
            async deleteData(table, id) {
                try {
                    const { error } = await supabaseClient
                        .from(table)
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    return true;
                } catch (error) {
                    console.error(`Error deleting from ${table}:`, error);
                    this.showNotification(`Failed to delete ${table}`, 'error');
                    throw error;
                }
            }

            // Call Postgres function (example)
            async callFunction(functionName, params = {}) {
                try {
                    const { data, error } = await supabaseClient
                        .rpc(functionName, params);
                    
                    if (error) throw error;
                    return data;
                } catch (error) {
                    console.error(`Error calling function ${functionName}:`, error);
                    this.showNotification(`Failed to execute ${functionName}`, 'error');
                    throw error;
                }
            }

            // Load all data from Supabase
            async loadAllData() {
                this.setLoading(true);
                try {
                    await Promise.all([
                        this.loadVehicles(),
                        this.loadDrivers(),
                        this.loadMaterials(),
                        this.loadRoutes(),
                        this.loadOperations(),
                        this.loadExpenses(),
                        this.loadMaintenance(),
                        this.loadInsurance(),
                        this.loadFuel(),
                        this.loadAttendance()
                    ]);
                } finally {
                    this.setLoading(false);
                }
            }

            async loadVehicles() {
                this.showLoading('vehiclesLoading', true);
                this.data.vehicles = await this.fetchData('vehicles');
                this.updateVehiclesTable();
                this.showLoading('vehiclesLoading', false);
            }

            async loadDrivers() {
                this.showLoading('driversLoading', true);
                this.data.drivers = await this.fetchData('drivers');
                this.updateDriversTable();
                this.showLoading('driversLoading', false);
            }

            async loadMaterials() {
                this.showLoading('materialsLoading', true);
                this.data.materials = await this.fetchData('materials');
                this.updateMaterialsTable();
                this.showLoading('materialsLoading', false);
            }

            async loadRoutes() {
                this.showLoading('routesLoading', true);
                this.data.routes = await this.fetchData('routes');
                this.updateRoutesTable();
                this.showLoading('routesLoading', false);
            }

            async loadOperations() {
                this.showLoading('operationsLoading', true);
                this.data.operations = await this.fetchData('operations');
                this.updateOperationsTable();
                this.showLoading('operationsLoading', false);
            }

            async loadExpenses() {
                this.showLoading('expensesLoading', true);
                this.data.expenses = await this.fetchData('expenses');
                this.updateExpensesTable();
                this.showLoading('expensesLoading', false);
            }

            async loadMaintenance() {
                this.showLoading('maintenanceLoading', true);
                this.data.maintenance = await this.fetchData('maintenance');
                this.updateMaintenanceTable();
                this.showLoading('maintenanceLoading', false);
            }

            async loadInsurance() {
                this.showLoading('insuranceLoading', true);
                this.data.insurance = await this.fetchData('insurance');
                this.updateInsuranceTable();
                this.showLoading('insuranceLoading', false);
            }

            async loadFuel() {
                this.showLoading('fuelLoading', true);
                this.data.fuel = await this.fetchData('fuel_records');
                this.updateFuelTable();
                this.showLoading('fuelLoading', false);
            }

            async loadAttendance() {
                this.showLoading('attendanceLoading', true);
                this.data.attendance = await this.fetchData('attendance');
                this.updateAttendanceTable();
                this.showLoading('attendanceLoading', false);
            }

            // Initialize sample data in Supabase
            async initializeSampleData() {
                if (!confirm('This will add sample data to your database. Continue?')) return;
                
                this.setLoading(true);
                try {
                    // Sample Vehicles
                    const vehicles = [
                        { vehicle_id: 'KBX-123Y', make: 'Isuzu', model: 'NPR', status: 'active',  },
                        { vehicle_id: 'KCR-456Z', make: 'Toyota', model: 'Dyna', status: 'maintenance',  },
                        { vehicle_id: 'KBT-789X', make: 'Mitsubishi', model: 'Fuso', status: 'active',  },
                        { vehicle_id: 'KCA-321W', make: 'Isuzu', model: 'FRR', status: 'active', }
                    ];

                    // Sample Drivers
                    const drivers = [
                        { name: 'John Doe', license_number: 'DL-12345', contact: '+254712345678', status: 'active', last_trip: '2023-10-15' },
                        { name: 'Jane Smith', license_number: 'DL-67890', contact: '+254723456789', status: 'active', last_trip: '2023-10-14' },
                        { name: 'Robert Johnson', license_number: 'DL-54321', contact: '+254734567890', status: 'suspended', last_trip: '2023-09-20' },
                        { name: 'Mary Wilson', license_number: 'DL-98765', contact: '+254745678901', status: 'active', last_trip: '2023-10-13' }
                    ];

                    // Sample Materials
                    const materials = [
                        { name: 'Construction Materials', unit: 'Ton' },
                        { name: 'Agricultural Products', unit: 'Kg' },
                        { name: 'Consumer Goods', unit: 'Box' },
                        { name: 'Industrial Equipment', unit: 'Unit' }
                    ];

                    // Sample Routes
                    const routes = [
                        { name: 'Nairobi to Mombasa', distance_km: 485, base_rate: 25000 },
                        { name: 'Nairobi to Kisumu', distance_km: 345, base_rate: 18000 },
                        { name: 'Nairobi to Nakuru', distance_km: 160, base_rate: 10000 },
                        { name: 'Mombasa to Malindi', distance_km: 120, base_rate: 8000 }
                    ];

                    // Sample Operations
                    const operations = [
                        { operation_date: '2023-10-15', vehicle_id: 1, driver_id: 1, route_id: 1, material_id: 1, trips: 3, tonnage: 12.5, rate_per_unit: 3500, fuel_cost: 15000 },
                        { operation_date: '2023-10-14', vehicle_id: 3, driver_id: 2, route_id: 2, material_id: 2, trips: 2, tonnage: 8.2, rate_per_unit: 2800, fuel_cost: 11000 },
                        { operation_date: '2023-10-13', vehicle_id: 4, driver_id: 4, route_id: 3, material_id: 3, trips: 4, tonnage: 15.0, rate_per_unit: 1800, fuel_cost: 9000 }
                    ];

                    // Sample Expenses
                    const expenses = [
                        { date: '2023-10-15', category: 'Fuel', description: 'Diesel refill', vehicle_id: 1, amount: 25000 },
                        { date: '2023-10-14', category: 'Repairs', description: 'Brake pads replacement', vehicle_id: 3, amount: 12000 },
                        { date: '2023-10-13', category: 'Insurance', description: 'Monthly premium', vehicle_id: 4, amount: 18000 }
                    ];

                    // Insert sample data
                    await Promise.all([
                        this.insertData('vehicles', vehicles),
                        this.insertData('drivers', drivers),
                        this.insertData('materials', materials),
                        this.insertData('routes', routes),
                        this.insertData('operations', operations),
                        this.insertData('expenses', expenses)
                    ]);

                    // Reload all data
                    await this.loadAllData();
                    this.updateDashboard();
                    this.updateDataStats();
                    
                    this.showNotification('Sample data initialized successfully!', 'success');
                } catch (error) {
                    console.error('Error initializing sample data:', error);
                    this.showNotification('Failed to initialize sample data', 'error');
                } finally {
                    this.setLoading(false);
                }
            }

            setLoading(isLoading) {
                this.isLoading = isLoading;
                const buttons = document.querySelectorAll('button');
                buttons.forEach(btn => {
                    btn.disabled = isLoading;
                });
            }

            showLoading(elementId, show) {
                const element = document.getElementById(elementId);
                if (element) {
                    if (show) {
                        element.classList.add('active');
                    } else {
                        element.classList.remove('active');
                    }
                }
            }
            
            setupEventListeners() {
                // Navigation
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        this.switchSection(e.currentTarget.getAttribute('data-section'));
                    });
                });
                
                // Mobile sidebar toggle
                document.getElementById('sidebarToggle').addEventListener('click', () => {
                    document.getElementById('sidebar').classList.toggle('active');
                });
                
                // Add buttons
                document.getElementById('addOperationBtn').addEventListener('click', () => this.openAddModal('operation'));
                document.getElementById('addVehicleBtn').addEventListener('click', () => this.openAddModal('vehicle'));
                document.getElementById('addDriverBtn').addEventListener('click', () => this.openAddModal('driver'));
                document.getElementById('addMaterialBtn').addEventListener('click', () => this.openAddModal('material'));
                document.getElementById('addRouteBtn').addEventListener('click', () => this.openAddModal('route'));
                document.getElementById('addExpenseBtn').addEventListener('click', () => this.openAddModal('expense'));
                document.getElementById('addMaintenanceBtn').addEventListener('click', () => this.openAddModal('maintenance'));
                document.getElementById('addInsuranceBtn').addEventListener('click', () => this.openAddModal('insurance'));
                document.getElementById('addFuelBtn').addEventListener('click', () => this.openAddModal('fuel'));
                
                // Modal
                document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
                document.getElementById('addModal').addEventListener('click', (e) => {
                    if (e.target.id === 'addModal') this.closeModal();
                });
                
                // Settings
                document.getElementById('saveAppSettings').addEventListener('click', () => this.saveSettings());
                document.getElementById('clearData').addEventListener('click', () => this.clearAllData());
                document.getElementById('exportData').addEventListener('click', () => this.exportData());
                document.getElementById('initializeData').addEventListener('click', () => this.initializeSampleData());
                
                // Sync button
                document.getElementById('syncBtn').addEventListener('click', () => this.syncData());
                
                // Load attendance
                document.getElementById('loadAttendance').addEventListener('click', () => this.loadAttendanceForDate());
                
                // Operations date filter
                document.getElementById('applyFilters').addEventListener('click', () => {
                    const startDate = document.getElementById('filterStartDate').value;
                    const endDate = document.getElementById('filterEndDate').value;
                    this.filterOperationsByDateRange(startDate, endDate);
                });

                // Vehicle status filter
                document.getElementById('vehicleStatusFilter').addEventListener('change', (e) => {
                    this.filterVehiclesByStatus(e.target.value);
                });

                // Driver status filter
                document.getElementById('driverStatusFilter').addEventListener('change', (e) => {
                    this.filterDriversByStatus(e.target.value);
                });
            }

            async loadAttendanceForDate() {
                const date = document.getElementById('attendanceDate').value;
                if (!date) return;
                
                this.showLoading('attendanceLoading', true);
                const attendance = await this.fetchData('attendance', { date: date });
                this.data.attendance = attendance;
                this.updateAttendanceTable();
                this.showLoading('attendanceLoading', false);
            }
            
            switchSection(sectionName) {
                // Update navigation
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
                
                // Update sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(sectionName).classList.add('active');
                
                // Update topbar title
                const titles = {
                    dashboard: 'Dashboard Overview',
                    operations: 'Operations Management',
                    vehicles: 'Vehicle Management',
                    drivers: 'Driver Management',
                    materials: 'Materials Management',
                    routes: 'Routes Management',
                    expenses: 'Expense Management',
                    maintenance: 'Maintenance Records',
                    insurance: 'Insurance Management',
                    attendance: 'Driver Attendance',
                    fuel: 'Fuel Records',
                    settings: 'Application Settings'
                };
                
                document.getElementById('topbarTitle').textContent = titles[sectionName] || 'FleetPro';
            }

            // TABLE UPDATE METHODS
            updateOperationsTable() {
                const tbody = document.getElementById('operationsTableBody');
                tbody.innerHTML = '';
                
                this.data.operations.forEach(operation => {
                    const vehicle = this.getVehicleById(operation.vehicle_id);
                    const driver = this.getDriverById(operation.driver_id);
                    const route = this.getRouteById(operation.route_id);
                    const material = this.getMaterialById(operation.material_id);
                    
                    const revenue = (operation.trips * operation.rate_per_unit) + (operation.tonnage * operation.rate_per_unit);
                    const profit = revenue - operation.fuel_cost;
                    
                   const row = `
                               <tr>
                                       <td>${operation.operation_date}</td>
        <td>${vehicle?.vehicle_id || 'N/A'}</td>
        <td>${driver?.name || 'N/A'}</td>
        <td>${route?.name || 'N/A'}</td>
        <td>${material?.name || 'N/A'}</td>
        <td>${operation.operation_type || 'N/A'}</td> <!-- New field -->
        <td>${operation.trips}</td>
        <td>${operation.tonnage || '0.00'}</td> <!-- New field -->
        <td>KSh ${operation.total_revenue?.toLocaleString() || '0'}</td>
        <td>KSh ${operation.net_profit?.toLocaleString() || '0'}</td>
        <td>
            <!-- Actions -->
        </td>
    </tr>`;
                    tbody.innerHTML += row;
                });
            }
            
            updateVehiclesTable() {
                const tbody = document.getElementById('vehiclesTableBody');
                tbody.innerHTML = '';
                
                this.data.vehicles.forEach(vehicle => {
                    const row = `
                        <tr>
                            <td>${vehicle.vehicle_id}</td>
                            <td>${vehicle.make} ${vehicle.model}</td>
                            <td><span class="status-badge ${this.getVehicleStatusClass(vehicle.status)}">${vehicle.status}</span></td>
                        
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('vehicle', ${vehicle.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('vehicles', ${vehicle.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateDriversTable() {
                const tbody = document.getElementById('driversTableBody');
                tbody.innerHTML = '';
                
                this.data.drivers.forEach(driver => {
                    const row = `
                        <tr>
                            <td>${driver.name}</td>
                            <td>${driver.license_number}</td>
                            <td>${driver.contact}</td>
                            <td><span class="status-badge ${this.getDriverStatusClass(driver.status)}">${driver.status}</span></td>
                            <td>${driver.last_trip || 'Never'}</td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('driver', ${driver.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('drivers', ${driver.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateMaterialsTable() {
                const tbody = document.getElementById('materialsTableBody');
                tbody.innerHTML = '';
                
                this.data.materials.forEach(material => {
                    const row = `
                        <tr>
                            <td>${material.name}</td>
                            <td>${material.unit}</td>
                            <td>${material.created_at ? new Date(material.created_at).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('material', ${material.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('materials', ${material.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateRoutesTable() {
                const tbody = document.getElementById('routesTableBody');
                tbody.innerHTML = '';
                
                this.data.routes.forEach(route => {
                    const row = `
                        <tr>
                            <td>${route.name}</td>
                            <td>${route.distance_km} km</td>
                            <td>KSh ${route.base_rate.toLocaleString()}</td>
                            <td>${route.created_at ? new Date(route.created_at).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('route', ${route.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('routes', ${route.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateExpensesTable() {
                const tbody = document.getElementById('expensesTableBody');
                tbody.innerHTML = '';
                
                this.data.expenses.forEach(expense => {
                    const vehicle = this.getVehicleById(expense.vehicle_id);
                    const row = `
                        <tr>
                            <td>${expense.date}</td>
                            <td>${expense.category}</td>
                            <td>${expense.description}</td>
                            <td>${vehicle?.vehicle_id || 'N/A'}</td>
                            <td>KSh ${expense.amount.toLocaleString()}</td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('expense', ${expense.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('expenses', ${expense.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateMaintenanceTable() {
                const tbody = document.getElementById('maintenanceTableBody');
                tbody.innerHTML = '';
                
                this.data.maintenance.forEach(maintenance => {
                    const vehicle = this.getVehicleById(maintenance.vehicle_id);
                    const row = `
                        <tr>
                            <td>${maintenance.date}</td>
                            <td>${vehicle?.vehicle_id || 'N/A'}</td>
                            <td>${maintenance.type}</td>
                            <td>${maintenance.description}</td>
                            <td>KSh ${maintenance.cost.toLocaleString()}</td>
                            <td><span class="status-badge ${maintenance.status === 'completed' ? 'badge-active' : 'badge-warning'}">${maintenance.status}</span></td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('maintenance', ${maintenance.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('maintenance', ${maintenance.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateInsuranceTable() {
                const tbody = document.getElementById('insuranceTableBody');
                tbody.innerHTML = '';
                
                this.data.insurance.forEach(insurance => {
                    const vehicle = this.getVehicleById(insurance.vehicle_id);
                    const row = `
                        <tr>
                            <td>${vehicle?.vehicle_id || 'N/A'}</td>
                            <td>${insurance.policy_number}</td>
                            <td>${insurance.provider}</td>
                            <td>${insurance.start_date}</td>
                            <td>${insurance.end_date}</td>
                            <td>KSh ${insurance.premium.toLocaleString()}</td>
                            <td><span class="status-badge badge-active">${insurance.status}</span></td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('insurance', ${insurance.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('insurance', ${insurance.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateAttendanceTable() {
                const tbody = document.getElementById('attendanceTableBody');
                tbody.innerHTML = '';
                
                this.data.attendance.forEach(attendance => {
                    const driver = this.getDriverById(attendance.driver_id);
                    const row = `
                        <tr>
                            <td>${driver?.name || 'N/A'}</td>
                            <td>${attendance.check_in || '-'}</td>
                            <td>${attendance.check_out || '-'}</td>
                            <td>${attendance.hours_worked}</td>
                            <td><span class="status-badge ${attendance.status === 'present' ? 'badge-present' : 'badge-absent'}">${attendance.status}</span></td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="app.editItem('attendance', ${attendance.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="app.deleteItem('attendance', ${attendance.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            
            updateFuelTable() {
                const tbody = document.getElementById('fuelTableBody');
                tbody.innerHTML = '';
                
                this.data.fuel.forEach(fuel => {
                    const vehicle = this.getVehicleById(fuel.vehicle_id);
                    const driver = this.getDriverById(fuel.driver_id);
                    const fuelRow = `
    <tr>
        <td>${fuel.refuel_date}</td>
        <td>${vehicle?.vehicle_id || 'N/A'}</td>
        <td>${driver?.name || 'N/A'}</td>
        <td>${fuel.liters}</td>
        <td>KSh ${fuel.cost_per_liter}</td>
        <td>KSh ${fuel.total_cost.toLocaleString()}</td>
        <td>${fuel.odometer_reading.toLocaleString()}</td>
        <td>
            ${fuel.receipt_url ? `<a href="${fuel.receipt_url}" target="_blank">View</a>` : 'N/A'}
        </td>
        <td>
            <!-- Actions -->
        </td>
    </tr>
`;
                    tbody.innerHTML += row;
                });
            }
            
            updateDashboard() {
                this.showLoading('dashboardLoading', true);
                
                // Calculate KPIs
                const totalRevenue = this.data.operations.reduce((sum, op) => {
                    return sum + ((op.trips * op.rate_per_unit) + (op.tonnage * op.rate_per_unit));
                }, 0);
                
                const totalExpenses = this.data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                const totalFuelCost = this.data.operations.reduce((sum, op) => sum + op.fuel_cost, 0);
                const totalMaintenanceCost = this.data.maintenance.reduce((sum, m) => sum + m.cost, 0);
                
                const totalExp = totalExpenses + totalFuelCost + totalMaintenanceCost;
                const netProfit = totalRevenue - totalExp;
                const totalTrips = this.data.operations.reduce((sum, op) => sum + op.trips, 0);
                
                // Update KPI cards
                document.querySelector('.kpi-card.revenue .kpi-value').textContent = `KSh ${totalRevenue.toLocaleString()}`;
                document.querySelector('.kpi-card.expenses .kpi-value').textContent = `KSh ${totalExp.toLocaleString()}`;
                document.querySelector('.kpi-card.profit .kpi-value').textContent = `KSh ${netProfit.toLocaleString()}`;
                document.querySelector('.kpi-card.trips .kpi-value').textContent = totalTrips;
                
                // Update trend indicators
                const revenueTrend = totalRevenue > 500000 ? 'up' : 'down';
                document.querySelector('.kpi-card.revenue .kpi-trend').className = 
                    `kpi-trend ${revenueTrend === 'up' ? '' : 'down'}`;
                document.querySelector('.kpi-card.revenue .kpi-trend i').className = 
                    `fas fa-arrow-${revenueTrend === 'up' ? 'up' : 'down'}`;
                document.querySelector('.kpi-card.revenue .kpi-trend').textContent = 
                    `${revenueTrend === 'up' ? '+' : '-'}15% from last month`;
                
                this.showLoading('dashboardLoading', false);
            }
            
            updateDataStats() {
                document.getElementById('totalOperations').textContent = this.data.operations.length;
                document.getElementById('totalVehicles').textContent = this.data.vehicles.length;
                document.getElementById('totalDrivers').textContent = this.data.drivers.length;
                document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
            }
            
            // Helper methods
            getVehicleById(id) {
                return this.data.vehicles.find(v => v.id === id);
            }
            
            getDriverById(id) {
                return this.data.drivers.find(d => d.id === id);
            }
            
            getRouteById(id) {
                return this.data.routes.find(r => r.id === id);
            }
            
            getMaterialById(id) {
                return this.data.materials.find(m => m.id === id);
            }
            
            getVehicleStatusClass(status) {
                const classes = {
                    'active': 'badge-active',
                    'inactive': 'badge-inactive',
                    'maintenance': 'badge-maintenance',
                    'retired': 'badge-inactive'
                };
                return classes[status] || '';
            }
            
            getDriverStatusClass(status) {
                const classes = {
                    'active': 'badge-active',
                    'inactive': 'badge-inactive',
                    'suspended': 'badge-suspended'
                };
                return classes[status] || '';
            }
            
            // Modal management
            openAddModal(type, id = null) {
                const modal = document.getElementById('addModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalBody = document.getElementById('modalBody');
                
                const titles = {
                    operation: '<i class="fas fa-road"></i> Add Operation',
                    vehicle: '<i class="fas fa-truck"></i> Add Vehicle',
                    driver: '<i class="fas fa-user"></i> Add Driver',
                    material: '<i class="fas fa-boxes"></i> Add Material',
                    route: '<i class="fas fa-route"></i> Add Route',
                    expense: '<i class="fas fa-money-bill-wave"></i> Add Expense',
                    maintenance: '<i class="fas fa-tools"></i> Add Maintenance',
                    insurance: '<i class="fas fa-shield-alt"></i> Add Insurance',
                    fuel: '<i class="fas fa-gas-pump"></i> Add Fuel Record'
                };
                
                modalTitle.innerHTML = titles[type] || '<i class="fas fa-plus"></i> Add Item';
                modalBody.innerHTML = this.getModalForm(type, id);
                modal.classList.add('active');
            }
            
            closeModal() {
                document.getElementById('addModal').classList.remove('active');
            }
            
            getModalForm(type, id = null) {
                let item = null;
                if (id) {
                    const collection = type + 's';
                    if (this.data[collection]) {
                        item = this.data[collection].find(i => i.id === id);
                    }
                }
                
                const forms = {
                    vehicle: `
                        <form id="modalForm" onsubmit="app.saveItem(event, 'vehicle')">
                            ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
                            <div class="form-group">
                                <label class="form-label">Vehicle ID</label>
                                <input type="text" class="form-control" name="vehicle_id" required value="${item?.vehicle_id || ''}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Make</label>
                                    <input type="text" class="form-control" name="make" required value="${item?.make || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Model</label>
                                    <input type="text" class="form-control" name="model" required value="${item?.model || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select class="form-control" name="status" required>
                                    <option value="active" ${item?.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="inactive" ${item?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                    <option value="maintenance" ${item?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                                    <option value="retired" ${item?.status === 'retired' ? 'selected' : ''}>Retired</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" class="btn btn-success">Save Vehicle</button>
                                <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
                            </div>
                        </form>
                    `,
                    driver: `
                        <form id="modalForm" onsubmit="app.saveItem(event, 'driver')">
                            ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
                            <div class="form-group">
                                <label class="form-label">Driver Name</label>
                                <input type="text" class="form-control" name="name" required value="${item?.name || ''}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">License Number</label>
                                    <input type="text" class="form-control" name="license_number" required value="${item?.license_number || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Contact</label>
                                    <input type="tel" class="form-control" name="contact" required value="${item?.contact || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select class="form-control" name="status" required>
                                    <option value="active" ${item?.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="inactive" ${item?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                    <option value="suspended" ${item?.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-success">Save Driver</button>
                                <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
                            </div>
                        </form>
                    `,
                    material: `
                        <form id="modalForm" onsubmit="app.saveItem(event, 'material')">
                            ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
                            <div class="form-group">
                                <label class="form-label">Material Name</label>
                                <input type="text" class="form-control" name="name" required value="${item?.name || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Unit</label>
                                <select class="form-control" name="unit" required>
                                    <option value="Ton" ${item?.unit === 'Ton' ? 'selected' : ''}>Ton</option>
                                    <option value="Kg" ${item?.unit === 'Kg' ? 'selected' : ''}>Kilogram</option>
                                    <option value="Box" ${item?.unit === 'Box' ? 'selected' : ''}>Box</option>
                                    <option value="Unit" ${item?.unit === 'Unit' ? 'selected' : ''}>Unit</option>
                                    <option value="Liter" ${item?.unit === 'Liter' ? 'selected' : ''}>Liter</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-success">Save Material</button>
                                <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
                            </div>
                        </form>
                    `,
                    route: `
                        <form id="modalForm" onsubmit="app.saveItem(event, 'route')">
                            ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
                            <div class="form-group">
                                <label class="form-label">Route Name</label>
                                <input type="text" class="form-control" name="name" placeholder="e.g., Nairobi to Mombasa" required value="${item?.name || ''}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Distance (km)</label>
                                    <input type="number" class="form-control" name="distance_km" required value="${item?.distance_km || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Base Rate (KSh)</label>
                                    <input type="number" class="form-control" name="base_rate" required value="${item?.base_rate || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-success">Save Route</button>
                                <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
                            </div>
                        </form>
                    `,
                    expense: `
                        <form id="modalForm" onsubmit="app.saveItem(event, 'expense')">
                            ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Date</label>
                                    <input type="date" class="form-control" name="date" required value="${item?.date || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Category</label>
                                    <select class="form-control" name="category" required>
                                        <option value="Fuel" ${item?.category === 'Fuel' ? 'selected' : ''}>Fuel</option>
                                        <option value="Maintenance" ${item?.category === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                        <option value="Insurance" ${item?.category === 'Insurance' ? 'selected' : ''}>Insurance</option>
                                        <option value="Repairs" ${item?.category === 'Repairs' ? 'selected' : ''}>Repairs</option>
                                        <option value="Other" ${item?.category === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <input type="text" class="form-control" name="description" required value="${item?.description || ''}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Vehicle</label>
                                    <select class="form-control" name="vehicle_id" required>
                                        ${this.getVehicleOptions(item?.vehicle_id)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Amount (KSh)</label>
                                    <input type="number" class="form-control" name="amount" required value="${item?.amount || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-success">Save Expense</button>
                                <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
                            </div>
                        </form>
                    `,
                    operation: `
                        <form id="modalForm" onsubmit="app.saveItem(event, 'operation')">
                            ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
                            <div class="form-group">
                                <label class="form-label">Operation Date</label>
                                <input type="date" class="form-control" name="operation_date" required value="${item?.operation_date || ''}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Vehicle</label>
                                    <select class="form-control" name="vehicle_id" required>
                                        ${this.getVehicleOptions(item?.vehicle_id)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Driver</label>
                                    <select class="form-control" name="driver_id" required>
                                        ${this.getDriverOptions(item?.driver_id)}
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Route</label>
                                    <select class="form-control" name="route_id" required>
                                        ${this.getRouteOptions(item?.route_id)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Material</label>
                                    <select class="form-control" name="material_id" required>
                                        ${this.getMaterialOptions(item?.material_id)}
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Trips</label>
                                    <input type="number" class="form-control" name="trips" min="1" required value="${item?.trips || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Tonnage</label>
                                    <input type="number" class="form-control" name="tonnage" step="0.1" required value="${item?.tonnage || ''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Rate per Unit (KSh)</label>
                                    <input type="number" class="form-control" name="rate_per_unit" required value="${item?.rate_per_unit || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Fuel Cost (KSh)</label>
                                    <input type="number" class="form-control" name="fuel_cost" required value="${item?.fuel_cost || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-success">Save Operation</button>
                                <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
                            </div>
                        </form>
                    `,
                    fuel: `
                        <form id="modalForm" onsubmit="app.saveItem(event, 'fuel')">
                            ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
                            <div class="form-group">
                                <label class="form-label">Date</label>
                                <input type="date" class="form-control" name="date" required value="${item?.date || ''}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Vehicle</label>
                                    <select class="form-control" name="vehicle_id" required>
                                        ${this.getVehicleOptions(item?.vehicle_id)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Driver</label>
                                    <select class="form-control" name="driver_id" required>
                                        ${this.getDriverOptions(item?.driver_id)}
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Liters</label>
                                    <input type="number" class="form-control" name="liters" step="0.1" required value="${item?.liters || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Rate per Liter (KSh)</label>
                                    <input type="number" class="form-control" name="rate_per_liter" step="0.01" required value="${item?.rate_per_liter || ''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Total Cost (KSh)</label>
                                    <input type="number" class="form-control" name="total_cost" required value="${item?.total_cost || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Odometer Reading</label>
                                    <input type="number" class="form-control" name="odometer" required value="${item?.odometer || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-success">Save Fuel Record</button>
                                <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
                            </div>
                        </form>
                    `
                    ,
                   // Add these form templates to the getModalForm method in script.js

// Maintenance form
maintenance: `
    <form id="modalForm" onsubmit="app.saveItem(event, 'maintenance')">
        ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" name="date" required value="${item?.date || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Vehicle</label>
                <select class="form-control" name="vehicle_id" required>
                    ${this.getVehicleOptions(item?.vehicle_id)}
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Maintenance Type</label>
                <select class="form-control" name="type" required>
                    <option value="Routine Service" ${item?.type === 'Routine Service' ? 'selected' : ''}>Routine Service</option>
                    <option value="Repair" ${item?.type === 'Repair' ? 'selected' : ''}>Repair</option>
                    <option value="Tire Replacement" ${item?.type === 'Tire Replacement' ? 'selected' : ''}>Tire Replacement</option>
                    <option value="Brake Service" ${item?.type === 'Brake Service' ? 'selected' : ''}>Brake Service</option>
                    <option value="Engine Work" ${item?.type === 'Engine Work' ? 'selected' : ''}>Engine Work</option>
                    <option value="Other" ${item?.type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" name="status" required>
                    <option value="scheduled" ${item?.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                    <option value="in-progress" ${item?.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${item?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${item?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" rows="3" required>${item?.description || ''}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Cost (KSh)</label>
                <input type="number" class="form-control" name="cost" step="0.01" required value="${item?.cost || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Odometer Reading</label>
                <input type="number" class="form-control" name="mileage" value="${item?.mileage || ''}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Service Provider</label>
            <input type="text" class="form-control" name="service_provider" value="${item?.service_provider || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Next Service Due</label>
            <input type="date" class="form-control" name="next_service_due" value="${item?.next_service_due || ''}">
        </div>
        <div class="form-group">
            <button type="submit" class="btn btn-success">Save Maintenance Record</button>
            <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
        </div>
    </form>
`,

// Insurance form
insurance: `
    <form id="modalForm" onsubmit="app.saveItem(event, 'insurance')">
        ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
        <div class="form-group">
            <label class="form-label">Vehicle</label>
            <select class="form-control" name="vehicle_id" required>
                ${this.getVehicleOptions(item?.vehicle_id)}
            </select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Policy Number</label>
                <input type="text" class="form-control" name="policy_number" required value="${item?.policy_number || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Insurance Provider</label>
                <input type="text" class="form-control" name="provider" required value="${item?.provider || ''}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-control" name="start_date" required value="${item?.start_date || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" class="form-control" name="end_date" required value="${item?.end_date || ''}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Premium Amount (KSh)</label>
                <input type="number" class="form-control" name="premium_amount" step="0.01" required value="${item?.premium_amount || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Coverage Type</label>
                <select class="form-control" name="coverage_type" required>
                    <option value="Comprehensive" ${item?.coverage_type === 'Comprehensive' ? 'selected' : ''}>Comprehensive</option>
                    <option value="Third Party" ${item?.coverage_type === 'Third Party' ? 'selected' : ''}>Third Party</option>
                    <option value="Third Party Fire & Theft" ${item?.coverage_type === 'Third Party Fire & Theft' ? 'selected' : ''}>Third Party Fire & Theft</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" name="status" required>
                <option value="active" ${item?.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="expired" ${item?.status === 'expired' ? 'selected' : ''}>Expired</option>
                <option value="cancelled" ${item?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-control" name="notes" rows="2">${item?.notes || ''}</textarea>
        </div>
        <div class="form-group">
            <button type="submit" class="btn btn-success">Save Insurance Record</button>
            <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
        </div>
    </form>
`,

// Attendance form
attendance: `
    <form id="modalForm" onsubmit="app.saveItem(event, 'attendance')">
        ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
        <div class="form-group">
            <label class="form-label">Driver</label>
            <select class="form-control" name="driver_id" required>
                ${this.getDriverOptions(item?.driver_id)}
            </select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" name="date" required value="${item?.date || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" name="status" required>
                    <option value="present" ${item?.status === 'present' ? 'selected' : ''}>Present</option>
                    <option value="absent" ${item?.status === 'absent' ? 'selected' : ''}>Absent</option>
                    <option value="late" ${item?.status === 'late' ? 'selected' : ''}>Late</option>
                    <option value="sick" ${item?.status === 'sick' ? 'selected' : ''}>Sick Leave</option>
                    <option value="vacation" ${item?.status === 'vacation' ? 'selected' : ''}>Vacation</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Check In Time</label>
                <input type="time" class="form-control" name="check_in" value="${item?.check_in || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Check Out Time</label>
                <input type="time" class="form-control" name="check_out" value="${item?.check_out || ''}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Hours Worked</label>
            <input type="number" class="form-control" name="hours_worked" step="0.1" value="${item?.hours_worked || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-control" name="notes" rows="2">${item?.notes || ''}</textarea>
        </div>
        <div class="form-group">
            <button type="submit" class="btn btn-success">Save Attendance Record</button>
            <button type="button" class="btn btn-danger" onclick="app.closeModal()">Cancel</button>
        </div>
    </form>
`
                };
                
                return forms[type] || '<p>Form not implemented yet.</p>';
            }
            
            getVehicleOptions(selectedId = null) {
                return this.data.vehicles
                    .filter(v => v.status === 'active')
                    .map(v => `<option value="${v.id}" ${selectedId === v.id ? 'selected' : ''}>${v.vehicle_id} - ${v.make} ${v.model}</option>`)
                    .join('');
            }
            
            getDriverOptions(selectedId = null) {
                return this.data.drivers
                    .filter(d => d.status === 'active')
                    .map(d => `<option value="${d.id}" ${selectedId === d.id ? 'selected' : ''}>${d.name}</option>`)
                    .join('');
            }
            
            getRouteOptions(selectedId = null) {
                return this.data.routes
                    .map(r => `<option value="${r.id}" ${selectedId === r.id ? 'selected' : ''}>${r.name}</option>`)
                    .join('');
            }
            
            getMaterialOptions(selectedId = null) {
                return this.data.materials
                    .map(m => `<option value="${m.id}" ${selectedId === m.id ? 'selected' : ''}>${m.name}</option>`)
                    .join('');
            }
            
            async saveItem(event, type) {
                event.preventDefault();
                const form = event.target;
                const formData = new FormData(form);
                const item = {};
                let isEdit = false;
                let id = null;

                for (let [key, value] of formData.entries()) {
                    if (key === 'id') {
                        id = parseInt(value);
                        isEdit = true;
                        continue;
                    }
                    
                    // Parse numeric fields
                    if (key === 'vehicle_id' || key === 'driver_id' || key === 'route_id' || 
                        key === 'material_id' || key === 'category_id') {
                        item[key] = parseInt(value);
                    } 
                    else if (key === 'trips' || key === 'tonnage' || key === 'rate_per_unit' || 
                             key === 'fuel_cost' || key === 'distance_km' || key === 'base_rate' || 
                             key === 'amount' || key === 'liters' || key === 'rate_per_liter' || 
                             key === 'total_cost' || key === 'odometer' || key === 'cost' || 
                             key === 'premium_amount' || key === 'mileage') {
                        item[key] = parseFloat(value);
                    } 
                    else {
                        item[key] = value;
                    }
                }

                try {
                    let result;
                    const table = type + 's';
                    
                    if (isEdit) {
                        result = await this.updateData(table, id, item);
                        this.showNotification(`${type} updated successfully!`, 'success');
                    } else {
                        // Add created_by reference for audit
                        const { data: { user } } = await supabaseClient.auth.getUser();
                        if (user) item.created_by = user.id;
                        
                        result = await this.insertData(table, item);
                        this.showNotification(`${type} created successfully!`, 'success');
                    }

                    // Reload data
                    await this.loadDataByType(type);
                    this.updateDashboard();
                    this.updateDataStats();
                    this.closeModal();
                } catch (error) {
                    console.error('Error saving item:', error);
                    this.showNotification(`Failed to save ${type}: ${error.message}`, 'error');
                }
            }
            
            editItem(type, id) {
                this.openAddModal(type, id);
            }
            
            async deleteItem(collection, id) {
                if (!confirm('Are you sure you want to delete this item?')) return;
                
                try {
                    await this.deleteData(collection, id);
                    
                    // Remove from local data
                    const index = this.data[collection].findIndex(item => item.id === id);
                    if (index !== -1) {
                        this.data[collection].splice(index, 1);
                    }
                    
                    // Update UI
                    await this.loadDataByType(collection.slice(0, -1)); // Remove 's' from collection name
                    this.updateDashboard();
                    this.updateDataStats();
                    this.showNotification('Item deleted successfully!', 'success');
                } catch (error) {
                    console.error('Error deleting item:', error);
                    this.showNotification('Failed to delete item', 'error');
                }
            }
            
            async syncData() {
                this.showNotification('Syncing with database...', 'info');
                document.getElementById('syncStatus').innerHTML = '<i class="fas fa-sync fa-spin"></i> Syncing';
                document.getElementById('syncStatus').className = 'status-badge badge-syncing';
                
                try {
                    await this.loadAllData();
                    this.updateDashboard();
                    this.updateDataStats();
                    
                    document.getElementById('syncStatus').innerHTML = '<i class="fas fa-sync"></i> Synced';
                    document.getElementById('syncStatus').className = 'status-badge badge-online';
                    this.showNotification('Data synchronized successfully!', 'success');
                } catch (error) {
                    document.getElementById('syncStatus').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
                    document.getElementById('syncStatus').className = 'status-badge badge-offline';
                    this.showNotification('Sync failed', 'error');
                }
            }
            
            async saveSettings() {
                try {
                    const companyName = document.getElementById('companyName').value;
                    const currency = document.getElementById('defaultCurrency').value;
                    const dateFormat = document.getElementById('dateFormat').value;
                    
                    this.data.settings = { companyName, currency, dateFormat };
                    
                    // Save settings to Supabase
                    await this.upsertData('settings', { id: 1, ...this.data.settings });
                    
                    this.showNotification('Settings saved successfully!', 'success');
                } catch (error) {
                    this.showNotification('Failed to save settings', 'error');
                }
            }
            
            async clearAllData() {
                if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) return;
                
                this.setLoading(true);
                try {
                    // Delete all data from Supabase tables
                    const tables = ['operations', 'expenses', 'maintenance', 'insurance', 'attendance', 'fuel'];
                    
                    for (const table of tables) {
                        const { error } = await supabaseClient
                            .from(table)
                            .delete()
                            .neq('id', 0); // Delete all records
                        
                        if (error) throw error;
                    }
                    
                    // Clear local data
                    this.data.operations = [];
                    this.data.expenses = [];
                    this.data.maintenance = [];
                    this.data.insurance = [];
                    this.data.attendance = [];
                    this.data.fuel = [];
                    
                    // Update UI
                    this.updateOperationsTable();
                    this.updateExpensesTable();
                    this.updateMaintenanceTable();
                    this.updateInsuranceTable();
                    this.updateAttendanceTable();
                    this.updateFuelTable();
                    this.updateDashboard();
                    this.updateDataStats();
                    
                    this.showNotification('All data cleared!', 'success');
                } catch (error) {
                    console.error('Error clearing data:', error);
                    this.showNotification('Failed to clear data', 'error');
                } finally {
                    this.setLoading(false);
                }
            }
            
            async exportData() {
                try {
                    // Get fresh data from Supabase
                    const exportData = {
                        vehicles: await this.fetchData('vehicles'),
                        drivers: await this.fetchData('drivers'),
                        materials: await this.fetchData('materials'),
                        routes: await this.fetchData('routes'),
                        operations: await this.fetchData('operations'),
                        expenses: await this.fetchData('expenses'),
                        maintenance: await this.fetchData('maintenance'),
                        insurance: await this.fetchData('insurance'),
                        attendance: await this.fetchData('attendance'),
                        fuel: await this.fetchData('fuel'),
                        settings: this.data.settings,
                        exportDate: new Date().toISOString()
                    };
                    
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `fleetpro-data-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    
                    this.showNotification('Data exported successfully!', 'success');
                } catch (error) {
                    console.error('Export error:', error);
                    this.showNotification('Failed to export data', 'error');
                }
            }
            
            showNotification(message, type = 'info') {
                const notification = document.getElementById('notification');
                notification.textContent = message;
                notification.style.display = 'block';
                
                // Set styling based on type
                const styles = {
                    success: { bg: '#dcfce7', color: '#15803d', border: '#22c55e' },
                    error: { bg: '#fee2e2', color: '#b91c1c', border: '#ef4444' },
                    warning: { bg: '#fef9c3', color: '#a16207', border: '#f59e0b' },
                    info: { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' }
                };
                
                const style = styles[type];
                notification.style.backgroundColor = style.bg;
                notification.style.color = style.color;
                notification.style.borderLeft = `4px solid ${style.border}`;
                
                // Auto hide after 4 seconds
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 4000);
            }
            
            initCharts() {
                // Revenue vs Expenses Chart
                const revenueCtx = document.getElementById('revenueChart').getContext('2d');
                this.charts.revenue = new Chart(revenueCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                        datasets: [
                            {
                                label: 'Revenue (KSh)',
                                data: [285000, 320000, 295000, 345000],
                                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                borderColor: 'rgba(16, 185, 129, 1)',
                                borderWidth: 1
                            },
                            {
                                label: 'Expenses (KSh)',
                                data: [82000, 95000, 78000, 92500],
                                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                                borderColor: 'rgba(239, 68, 68, 1)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return 'KSh ' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
                
                // Utilization Chart
                const utilCtx = document.getElementById('utilizationChart').getContext('2d');
                this.charts.utilization = new Chart(utilCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['KBX-123Y', 'KCR-456Z', 'KBT-789X', 'KCA-321W'],
                        datasets: [{
                            data: [38, 28, 22, 12],
                            backgroundColor: [
                                'rgba(37, 99, 235, 0.7)',
                                'rgba(16, 185, 129, 0.7)',
                                'rgba(245, 158, 11, 0.7)',
                                'rgba(239, 68, 68, 0.7)'
                            ],
                            borderColor: [
                                'rgba(37, 99, 235, 1)',
                                'rgba(16, 185, 129, 1)',
                                'rgba(245, 158, 11, 1)',
                                'rgba(239, 68, 68, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.label + ': ' + context.raw + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            async filterOperationsByDateRange(startDate, endDate) {
                try {
                    let query = supabaseClient.from('operations').select('*');
                    
                    if (startDate) {
                        query = query.gte('operation_date', startDate);
                    }
                    if (endDate) {
                        query = query.lte('operation_date', endDate);
                    }
                    
                    const { data, error } = await query.order('operation_date', { ascending: false });
                    
                    if (error) throw error;
                    
                    this.data.operations = data || [];
                    this.updateOperationsTable();
                    this.updateDashboard();
                } catch (error) {
                    console.error('Error filtering operations:', error);
                    this.showNotification('Failed to filter operations', 'error');
                }
            }

            async filterVehiclesByStatus(status) {
                try {
                    let query = supabaseClient.from('vehicles').select('*');
                    
                    if (status) {
                        query = query.eq('status', status);
                    }
                    
                    const { data, error } = await query.order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    
                    this.data.vehicles = data || [];
                    this.updateVehiclesTable();
                } catch (error) {
                    console.error('Error filtering vehicles:', error);
                    this.showNotification('Failed to filter vehicles', 'error');
                }
            }

            async filterDriversByStatus(status) {
                try {
                    let query = supabaseClient.from('drivers').select('*');
                    
                    if (status) {
                        query = query.eq('status', status);
                    }
                    
                    const { data, error } = await query.order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    
                    this.data.drivers = data || [];
                    this.updateDriversTable();
                } catch (error) {
                    console.error('Error filtering drivers:', error);
                    this.showNotification('Failed to filter drivers', 'error');
                }
            }

            async loadDataByType(type) {
                switch(type) {
                    case 'vehicle': await this.loadVehicles(); break;
                    case 'driver': await this.loadDrivers(); break;
                    case 'material': await this.loadMaterials(); break;
                    case 'route': await this.loadRoutes(); break;
                    case 'operation': await this.loadOperations(); break;
                    case 'expense': await this.loadExpenses(); break;
                    case 'maintenance': await this.loadMaintenance(); break;
                    case 'insurance': await this.loadInsurance(); break;
                    case 'fuel': await this.loadFuel(); break;
                    case 'attendance': await this.loadAttendance(); break;
                }
            }
        }
        
        // Initialize the application
        let app;
        document.addEventListener('DOMContentLoaded', function() {
            app = new FleetProApp();
        });
