'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { getWorkspaceId } from '@/repositories/finance';
import { vehicleSchema } from '@/lib/validations/finance';

type FuelType = 'GASOLINE'|'ETHANOL'|'DIESEL'|'GNV';
type Vehicle = { id: string; name: string; plate: string|null; brand: string|null; model: string; year: number|null; current_odometer: number|null; active: boolean; vehicle_fuel_types: Array<{ fuel_type: FuelType }> };
const fuelOptions: Array<[FuelType, string]> = [['GASOLINE', 'Gasolina'], ['ETHANOL', 'Etanol'], ['DIESEL', 'Diesel'], ['GNV', 'GNV']];

export function VehiclesClient() {
  const client = useMemo(() => createClient(), []);
  const [workspace, setWorkspace] = useState<string|null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>(['GASOLINE']);
  const [form, setForm] = useState({ name: '', plate: '', brand: '', model: '', year: '', odometer: '0' });
  const load = useCallback(async () => { const id = await getWorkspaceId(client); setWorkspace(id); if (!id) return; const result = await client.from('vehicles').select('id,name,plate,brand,model,year,current_odometer,active,vehicle_fuel_types(fuel_type)').eq('workspace_id', id).order('active', { ascending: false }).order('name'); setVehicles((result.data as Vehicle[]) || []); }, [client]);
  useEffect(() => { void load(); }, [load]);
  function toggleFuel(fuel: FuelType) { setFuelTypes(current => current.includes(fuel) ? current.filter(item => item !== fuel) : [...current, fuel]); }
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!workspace) return; const data = vehicleSchema.parse({ ...form, year: form.year || undefined, fuelTypes }); await client.rpc('create_vehicle', { p_workspace_id: workspace, p_owner_user_id: null, p_name: data.name, p_plate: data.plate || null, p_brand: data.brand || null, p_model: data.model, p_year: data.year || null, p_odometer: data.odometer, p_fuel_types: data.fuelTypes }); setForm({ name: '', plate: '', brand: '', model: '', year: '', odometer: '0' }); setFuelTypes(['GASOLINE']); await load(); }
  return <div className="module"><h1>Veículos</h1><p className="muted">Cadastre veículos e os combustíveis aceitos para controlar consumo e custo por quilômetro.</p><form className="stack-form" onSubmit={submit}><input placeholder="Nome do veículo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><div className="field-row"><input placeholder="Marca" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /><input placeholder="Modelo" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} required /></div><div className="field-row"><input placeholder="Placa" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} /><input type="number" placeholder="Ano" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /><input type="number" step="0.1" min="0" placeholder="Km atual" value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} required /></div><div className="fuel-checks"><span className="muted">Combustíveis aceitos</span>{fuelOptions.map(([value, label]) => <label key={value}><input type="checkbox" checked={fuelTypes.includes(value)} onChange={() => toggleFuel(value)} />{label}</label>)}</div><button className="primary-button">Adicionar veículo</button></form><div className="list-card">{vehicles.map(vehicle => <div className="list-row" key={vehicle.id}><div><strong>{vehicle.name} · {vehicle.model}</strong><span>{vehicle.plate || 'Sem placa'} · {vehicle.current_odometer || 0} km · {vehicle.vehicle_fuel_types.map(item => item.fuel_type).join(', ')}</span></div><span className={vehicle.active ? 'pill' : 'pill muted-pill'}>{vehicle.active ? 'Ativo' : 'Inativo'}</span></div>)}{vehicles.length === 0 && <p className="muted">Nenhum veículo cadastrado.</p>}</div></div>;
}
