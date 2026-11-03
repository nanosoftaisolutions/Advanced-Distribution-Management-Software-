import React, { useState } from 'react';
import { Warehouse as WarehouseIcon, Truck, Plus, ThermometerSnowflake, MapPin, User, CheckCircle2 } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Warehouse, DeliveryVehicle } from '../types/pdms';

export const WarehousesView: React.FC = () => {
  const { warehouses, batches, vehicles } = usePDMS();

  const [activeTab, setActiveTab] = useState<'warehouses' | 'fleet'>('warehouses');

  const whColumns: Column<Warehouse>[] = [
    {
      header: 'Warehouse Name',
      accessorKey: 'name',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-2">
          <WarehouseIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">{row.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">Code: {row.code}</div>
          </div>
        </div>
      )
    },
    {
      header: 'City & Address',
      render: row => (
        <div className="text-xs">
          <span className="text-slate-200">{row.city}</span>
          <div className="text-[10px] text-slate-500">{row.address}</div>
        </div>
      )
    },
    {
      header: 'Cold Chain Vault (2-8°C)',
      render: row =>
        row.hasColdStorage ? (
          <Badge variant="sky">
            <ThermometerSnowflake className="w-3 h-3" />
            <span>Refrigerated Vault</span>
          </Badge>
        ) : (
          <Badge variant="slate">Standard Climate</Badge>
        )
    },
    {
      header: 'Total Racks',
      accessorKey: 'totalRacks',
      align: 'center',
      render: row => <span className="font-mono text-slate-300">{row.totalRacks} Racks</span>
    },
    {
      header: 'Batches Stored',
      align: 'right',
      render: row => {
        const storedBatches = batches.filter(b => b.warehouseId === row.id && b.availableQuantity > 0);
        const totalUnits = storedBatches.reduce((a, b) => a + b.availableQuantity, 0);
        return (
          <div className="font-mono tabular-nums">
            <span className="font-bold text-white">{storedBatches.length} Batches</span>
            <div className="text-[10px] text-slate-400">{totalUnits.toLocaleString()} units</div>
          </div>
        );
      }
    },
    {
      header: 'Manager',
      accessorKey: 'managerName',
      render: row => (
        <div className="text-xs">
          <span className="text-slate-300">{row.managerName}</span>
          <div className="text-[10px] font-mono text-slate-500">{row.contactNumber}</div>
        </div>
      )
    }
  ];

  const vehColumns: Column<DeliveryVehicle>[] = [
    {
      header: 'Vehicle Reg #',
      accessorKey: 'vehicleNumber',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-mono font-bold text-white text-sm">{row.vehicleNumber}</span>
        </div>
      )
    },
    {
      header: 'Vehicle Model',
      accessorKey: 'vehicleType',
      render: row => <span className="text-slate-200 text-xs">{row.vehicleType}</span>
    },
    {
      header: 'Assigned Driver',
      accessorKey: 'driverName',
      render: row => (
        <div className="text-xs">
          <span className="text-slate-200 font-medium">{row.driverName}</span>
          <div className="text-[10px] text-slate-500 font-mono">{row.driverPhone}</div>
        </div>
      )
    },
    {
      header: 'Delivery Route',
      accessorKey: 'routeAssigned',
      render: row => <span className="text-slate-300 text-xs">{row.routeAssigned}</span>
    },
    {
      header: 'Fuel Balance',
      accessorKey: 'fuelBalancePKR',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-emerald-400">
          Rs. {row.fuelBalancePKR.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => {
        const variants: { [k: string]: 'emerald' | 'sky' | 'amber' } = {
          Available: 'emerald',
          'On Delivery': 'sky',
          'Under Maintenance': 'amber'
        };
        return <Badge variant={variants[row.status] || 'emerald'}>{row.status}</Badge>;
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Warehouse Depots & Delivery Fleet</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cold storage vaults (2-8°C), rack management, stock transfers, delivery vans and route dispatching
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'warehouses' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Warehouse Facilities
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'fleet' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Delivery Vehicles & Fleet
          </button>
        </div>
      </div>

      {activeTab === 'warehouses' ? (
        <DataTable
          columns={whColumns}
          data={warehouses}
          searchPlaceholder="Search warehouses by name, code or city..."
          searchFilterKeys={['name', 'code', 'city', 'managerName']}
          exportFilename="Warehouse_Locations_Register"
        />
      ) : (
        <DataTable
          columns={vehColumns}
          data={vehicles}
          searchPlaceholder="Search vehicles by registration, driver or route..."
          searchFilterKeys={['vehicleNumber', 'driverName', 'routeAssigned']}
          exportFilename="Delivery_Fleet_Register"
        />
      )}
    </div>
  );
};
