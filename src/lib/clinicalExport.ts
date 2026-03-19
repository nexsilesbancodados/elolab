import { format } from 'date-fns';

/**
 * Export patient clinical data in interoperable formats (FHIR-like JSON or XML).
 * Follows HL7 FHIR R4 structure for maximum compatibility.
 */

interface ExportPaciente {
  id: string;
  nome: string;
  nome_social?: string;
  cpf?: string;
  data_nascimento?: string;
  sexo?: string;
  telefone?: string;
  email?: string;
  alergias?: string[];
}

interface ExportProntuario {
  id: string;
  data: string;
  queixa_principal?: string;
  historia_doenca_atual?: string;
  hipotese_diagnostica?: string;
  diagnostico_principal?: string;
  conduta?: string;
  sinais_vitais?: Record<string, string>;
  medico_nome?: string;
  medico_crm?: string;
}

interface ExportData {
  paciente: ExportPaciente;
  prontuarios: ExportProntuario[];
  exames?: Array<{ tipo: string; data?: string; status?: string; resultado?: string }>;
  prescricoes?: Array<{ medicamento: string; dosagem?: string; posologia?: string }>;
}

function mapSexo(sexo?: string): string {
  if (sexo === 'masculino') return 'male';
  if (sexo === 'feminino') return 'female';
  return 'unknown';
}

/**
 * Generate FHIR-compatible JSON export
 */
export function exportToFHIR(data: ExportData): string {
  const bundle: any = {
    resourceType: 'Bundle',
    type: 'document',
    timestamp: new Date().toISOString(),
    meta: {
      source: 'EloLab Clínica Médica',
      versionId: '1',
      lastUpdated: new Date().toISOString(),
    },
    entry: [],
  };

  // Patient resource
  const patient: any = {
    resource: {
      resourceType: 'Patient',
      id: data.paciente.id,
      name: [
        {
          use: 'official',
          text: data.paciente.nome,
        },
      ],
      gender: mapSexo(data.paciente.sexo),
      birthDate: data.paciente.data_nascimento || undefined,
      telecom: [],
      identifier: [],
    },
  };

  if (data.paciente.nome_social) {
    patient.resource.name.push({
      use: 'usual',
      text: data.paciente.nome_social,
    });
  }

  if (data.paciente.cpf) {
    patient.resource.identifier.push({
      system: 'urn:oid:2.16.840.1.113883.13.237',
      value: data.paciente.cpf,
      type: { text: 'CPF' },
    });
  }

  if (data.paciente.telefone) {
    patient.resource.telecom.push({ system: 'phone', value: data.paciente.telefone });
  }
  if (data.paciente.email) {
    patient.resource.telecom.push({ system: 'email', value: data.paciente.email });
  }

  bundle.entry.push(patient);

  // Allergy resources
  if (data.paciente.alergias?.length) {
    data.paciente.alergias.forEach((alergia, i) => {
      bundle.entry.push({
        resource: {
          resourceType: 'AllergyIntolerance',
          id: `allergy-${i}`,
          patient: { reference: `Patient/${data.paciente.id}` },
          code: { text: alergia },
          clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }],
          },
        },
      });
    });
  }

  // Encounter/Prontuario resources
  data.prontuarios.forEach((p) => {
    const encounter: any = {
      resource: {
        resourceType: 'Encounter',
        id: p.id,
        status: 'finished',
        class: { code: 'AMB', display: 'ambulatory' },
        period: { start: p.data },
        subject: { reference: `Patient/${data.paciente.id}` },
        reasonCode: p.queixa_principal ? [{ text: p.queixa_principal }] : undefined,
      },
    };
    bundle.entry.push(encounter);

    // Condition (diagnosis)
    if (p.diagnostico_principal || p.hipotese_diagnostica) {
      bundle.entry.push({
        resource: {
          resourceType: 'Condition',
          id: `condition-${p.id}`,
          subject: { reference: `Patient/${data.paciente.id}` },
          encounter: { reference: `Encounter/${p.id}` },
          code: { text: p.diagnostico_principal || p.hipotese_diagnostica },
          recordedDate: p.data,
        },
      });
    }

    // Vital signs
    if (p.sinais_vitais) {
      const vitals = p.sinais_vitais;
      const vitalEntries: Array<{ code: string; display: string; value?: string; unit: string }> = [
        { code: '8480-6', display: 'Systolic blood pressure', value: vitals.pressao_sistolica, unit: 'mmHg' },
        { code: '8462-4', display: 'Diastolic blood pressure', value: vitals.pressao_diastolica, unit: 'mmHg' },
        { code: '8867-4', display: 'Heart rate', value: vitals.frequencia_cardiaca, unit: 'bpm' },
        { code: '8310-5', display: 'Body temperature', value: vitals.temperatura, unit: '°C' },
        { code: '2708-6', display: 'Oxygen saturation', value: vitals.saturacao, unit: '%' },
        { code: '29463-7', display: 'Body weight', value: vitals.peso, unit: 'kg' },
        { code: '8302-2', display: 'Body height', value: vitals.altura, unit: 'cm' },
      ];

      vitalEntries.filter(v => v.value).forEach((v, i) => {
        bundle.entry.push({
          resource: {
            resourceType: 'Observation',
            id: `obs-${p.id}-${i}`,
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
            code: { coding: [{ system: 'http://loinc.org', code: v.code, display: v.display }] },
            subject: { reference: `Patient/${data.paciente.id}` },
            encounter: { reference: `Encounter/${p.id}` },
            effectiveDateTime: p.data,
            valueQuantity: { value: parseFloat(v.value!), unit: v.unit },
          },
        });
      });
    }
  });

  // MedicationRequest resources
  data.prescricoes?.forEach((presc, i) => {
    bundle.entry.push({
      resource: {
        resourceType: 'MedicationRequest',
        id: `med-${i}`,
        status: 'active',
        intent: 'order',
        subject: { reference: `Patient/${data.paciente.id}` },
        medicationCodeableConcept: { text: presc.medicamento },
        dosageInstruction: presc.posologia ? [{ text: `${presc.dosagem || ''} ${presc.posologia}`.trim() }] : undefined,
      },
    });
  });

  return JSON.stringify(bundle, null, 2);
}

/**
 * Generate XML export (simplified CDA-like structure)
 */
export function exportToXML(data: ExportData): string {
  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <id root="${data.paciente.id}"/>
  <code code="34133-9" displayName="Summarization of Episode Note" codeSystem="2.16.840.1.113883.6.1"/>
  <title>Prontuário Clínico — ${escapeXml(data.paciente.nome)}</title>
  <effectiveTime value="${format(new Date(), 'yyyyMMddHHmmss')}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  
  <recordTarget>
    <patientRole>
      <id extension="${escapeXml(data.paciente.cpf || '')}" root="2.16.840.1.113883.13.237"/>
      <patient>
        <name>${escapeXml(data.paciente.nome_social || data.paciente.nome)}</name>
        <administrativeGenderCode code="${mapSexo(data.paciente.sexo)}"/>
        ${data.paciente.data_nascimento ? `<birthTime value="${data.paciente.data_nascimento.replace(/-/g, '')}"/>` : ''}
      </patient>
    </patientRole>
  </recordTarget>

  <component>
    <structuredBody>`;

  // Allergies section
  if (data.paciente.alergias?.length) {
    xml += `
      <component>
        <section>
          <code code="48765-2" displayName="Allergies"/>
          <title>Alergias</title>
          <text>
            <list>
              ${data.paciente.alergias.map(a => `<item>${escapeXml(a)}</item>`).join('\n              ')}
            </list>
          </text>
        </section>
      </component>`;
  }

  // Encounters section
  data.prontuarios.forEach(p => {
    xml += `
      <component>
        <section>
          <code code="46240-8" displayName="Encounter"/>
          <title>Atendimento — ${escapeXml(p.data)}</title>
          <text>
            ${p.queixa_principal ? `<paragraph><caption>Queixa Principal</caption>${escapeXml(p.queixa_principal)}</paragraph>` : ''}
            ${p.hipotese_diagnostica ? `<paragraph><caption>Hipótese Diagnóstica</caption>${escapeXml(p.hipotese_diagnostica)}</paragraph>` : ''}
            ${p.diagnostico_principal ? `<paragraph><caption>Diagnóstico</caption>${escapeXml(p.diagnostico_principal)}</paragraph>` : ''}
            ${p.conduta ? `<paragraph><caption>Conduta</caption>${escapeXml(p.conduta)}</paragraph>` : ''}
            ${p.medico_nome ? `<paragraph><caption>Médico</caption>${escapeXml(p.medico_nome)} — CRM: ${escapeXml(p.medico_crm || '')}</paragraph>` : ''}
          </text>
        </section>
      </component>`;
  });

  xml += `
    </structuredBody>
  </component>
</ClinicalDocument>`;

  return xml;
}

/**
 * Download exported data as a file
 */
export function downloadClinicalExport(content: string, filename: string, type: 'json' | 'xml') {
  const mimeType = type === 'json' ? 'application/json' : 'application/xml';
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${type}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
