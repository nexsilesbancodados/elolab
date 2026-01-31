export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string | null
          data: string
          hora_fim: string | null
          hora_inicio: string
          id: string
          medico_id: string
          observacoes: string | null
          paciente_id: string
          sala_id: string | null
          status: Database["public"]["Enums"]["status_agendamento"] | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          hora_fim?: string | null
          hora_inicio: string
          id?: string
          medico_id: string
          observacoes?: string | null
          paciente_id: string
          sala_id?: string | null
          status?: Database["public"]["Enums"]["status_agendamento"] | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          hora_fim?: string | null
          hora_inicio?: string
          id?: string
          medico_id?: string
          observacoes?: string | null
          paciente_id?: string
          sala_id?: string | null
          status?: Database["public"]["Enums"]["status_agendamento"] | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      atestados: {
        Row: {
          cid: string | null
          created_at: string | null
          data_emissao: string | null
          data_fim: string | null
          data_inicio: string | null
          dias: number | null
          id: string
          medico_id: string
          motivo: string | null
          observacoes: string | null
          paciente_id: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          cid?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dias?: number | null
          id?: string
          medico_id: string
          motivo?: string | null
          observacoes?: string | null
          paciente_id: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          cid?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dias?: number | null
          id?: string
          medico_id?: string
          motivo?: string | null
          observacoes?: string | null
          paciente_id?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atestados_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atestados_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changes: Json | null
          collection: string
          id: string
          record_id: string
          record_name: string | null
          timestamp: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          collection: string
          id?: string
          record_id: string
          record_name?: string | null
          timestamp?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          collection?: string
          id?: string
          record_id?: string
          record_name?: string | null
          timestamp?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      convenios: {
        Row: {
          ativo: boolean | null
          carencia: number | null
          cnpj: string | null
          codigo: string
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
          tipo_planos: string[] | null
          updated_at: string | null
          valor_consulta: number | null
          valor_retorno: number | null
          website: string | null
        }
        Insert: {
          ativo?: boolean | null
          carencia?: number | null
          cnpj?: string | null
          codigo: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo_planos?: string[] | null
          updated_at?: string | null
          valor_consulta?: number | null
          valor_retorno?: number | null
          website?: string | null
        }
        Update: {
          ativo?: boolean | null
          carencia?: number | null
          cnpj?: string | null
          codigo?: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo_planos?: string[] | null
          updated_at?: string | null
          valor_consulta?: number | null
          valor_retorno?: number | null
          website?: string | null
        }
        Relationships: []
      }
      estoque: {
        Row: {
          categoria: string
          created_at: string | null
          descricao: string | null
          fornecedor: string | null
          id: string
          localizacao: string | null
          lote: string | null
          nome: string
          quantidade: number
          quantidade_minima: number | null
          unidade: string | null
          updated_at: string | null
          validade: string | null
          valor_unitario: number | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          lote?: string | null
          nome: string
          quantidade?: number
          quantidade_minima?: number | null
          unidade?: string | null
          updated_at?: string | null
          validade?: string | null
          valor_unitario?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          lote?: string | null
          nome?: string
          quantidade?: number
          quantidade_minima?: number | null
          unidade?: string | null
          updated_at?: string | null
          validade?: string | null
          valor_unitario?: number | null
        }
        Relationships: []
      }
      exames: {
        Row: {
          arquivo_resultado: string | null
          created_at: string | null
          data_agendamento: string | null
          data_realizacao: string | null
          data_solicitacao: string | null
          descricao: string | null
          id: string
          medico_solicitante_id: string
          observacoes: string | null
          paciente_id: string
          resultado: string | null
          status: Database["public"]["Enums"]["status_exame"] | null
          tipo_exame: string
          updated_at: string | null
        }
        Insert: {
          arquivo_resultado?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_realizacao?: string | null
          data_solicitacao?: string | null
          descricao?: string | null
          id?: string
          medico_solicitante_id: string
          observacoes?: string | null
          paciente_id: string
          resultado?: string | null
          status?: Database["public"]["Enums"]["status_exame"] | null
          tipo_exame: string
          updated_at?: string | null
        }
        Update: {
          arquivo_resultado?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_realizacao?: string | null
          data_solicitacao?: string | null
          descricao?: string | null
          id?: string
          medico_solicitante_id?: string
          observacoes?: string | null
          paciente_id?: string
          resultado?: string | null
          status?: Database["public"]["Enums"]["status_exame"] | null
          tipo_exame?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exames_medico_solicitante_id_fkey"
            columns: ["medico_solicitante_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_atendimento: {
        Row: {
          agendamento_id: string
          created_at: string | null
          horario_chegada: string | null
          id: string
          posicao: number
          prioridade: string | null
          sala_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agendamento_id: string
          created_at?: string | null
          horario_chegada?: string | null
          id?: string
          posicao: number
          prioridade?: string | null
          sala_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string
          created_at?: string | null
          horario_chegada?: string | null
          id?: string
          posicao?: number
          prioridade?: string | null
          sala_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fila_atendimento_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_atendimento_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string | null
          data_admissao: string | null
          departamento: string | null
          email: string | null
          id: string
          nome: string
          salario: number | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          data_admissao?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nome: string
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          data_admissao?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nome?: string
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          agendamento_id: string | null
          categoria: string
          created_at: string | null
          data: string
          data_vencimento: string | null
          descricao: string
          forma_pagamento: string | null
          id: string
          paciente_id: string | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          categoria: string
          created_at?: string | null
          data?: string
          data_vencimento?: string | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          paciente_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          categoria?: string
          created_at?: string | null
          data?: string
          data_vencimento?: string | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          paciente_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          created_at: string | null
          data_cadastro: string | null
          especialidade: string | null
          id: string
          medico_id: string | null
          motivo: string | null
          observacoes: string | null
          paciente_id: string
          preferencia_horario: string | null
          prioridade: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_cadastro?: string | null
          especialidade?: string | null
          id?: string
          medico_id?: string | null
          motivo?: string | null
          observacoes?: string | null
          paciente_id: string
          preferencia_horario?: string | null
          prioridade?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_cadastro?: string | null
          especialidade?: string | null
          id?: string
          medico_id?: string | null
          motivo?: string | null
          observacoes?: string | null
          paciente_id?: string
          preferencia_horario?: string | null
          prioridade?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      medicos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          crm: string
          especialidade: string | null
          id: string
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          crm: string
          especialidade?: string | null
          id?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          crm?: string
          especialidade?: string | null
          id?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string | null
          data: string | null
          id: string
          item_id: string
          motivo: string | null
          quantidade: number
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          id?: string
          item_id: string
          motivo?: string | null
          quantidade: number
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          id?: string
          item_id?: string
          motivo?: string | null
          quantidade?: number
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          alergias: string[] | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          convenio_id: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          numero_carteira: string | null
          observacoes: string | null
          sexo: string | null
          telefone: string | null
          updated_at: string | null
          validade_carteira: string | null
        }
        Insert: {
          alergias?: string[] | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          numero_carteira?: string | null
          observacoes?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string | null
          validade_carteira?: string | null
        }
        Update: {
          alergias?: string[] | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          numero_carteira?: string | null
          observacoes?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string | null
          validade_carteira?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenios"
            referencedColumns: ["id"]
          },
        ]
      }
      prescricoes: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          dosagem: string | null
          duracao: string | null
          id: string
          medicamento: string
          medico_id: string
          observacoes: string | null
          paciente_id: string
          posologia: string | null
          prontuario_id: string | null
          quantidade: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          dosagem?: string | null
          duracao?: string | null
          id?: string
          medicamento: string
          medico_id: string
          observacoes?: string | null
          paciente_id: string
          posologia?: string | null
          prontuario_id?: string | null
          quantidade?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          dosagem?: string | null
          duracao?: string | null
          id?: string
          medicamento?: string
          medico_id?: string
          observacoes?: string | null
          paciente_id?: string
          posologia?: string | null
          prontuario_id?: string | null
          quantidade?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescricoes_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescricoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescricoes_prontuario_id_fkey"
            columns: ["prontuario_id"]
            isOneToOne: false
            referencedRelation: "prontuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar?: string | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prontuarios: {
        Row: {
          agendamento_id: string | null
          conduta: string | null
          created_at: string | null
          data: string
          exames_fisicos: string | null
          hipotese_diagnostica: string | null
          historia_doenca_atual: string | null
          id: string
          medico_id: string
          paciente_id: string
          queixa_principal: string | null
          updated_at: string | null
        }
        Insert: {
          agendamento_id?: string | null
          conduta?: string | null
          created_at?: string | null
          data?: string
          exames_fisicos?: string | null
          hipotese_diagnostica?: string | null
          historia_doenca_atual?: string | null
          id?: string
          medico_id: string
          paciente_id: string
          queixa_principal?: string | null
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string | null
          conduta?: string | null
          created_at?: string | null
          data?: string
          exames_fisicos?: string | null
          hipotese_diagnostica?: string | null
          historia_doenca_atual?: string | null
          id?: string
          medico_id?: string
          paciente_id?: string
          queixa_principal?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prontuarios_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          capacidade: number | null
          created_at: string | null
          equipamentos: string[] | null
          id: string
          medico_responsavel: string | null
          nome: string
          status: Database["public"]["Enums"]["status_sala"] | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          capacidade?: number | null
          created_at?: string | null
          equipamentos?: string[] | null
          id?: string
          medico_responsavel?: string | null
          nome: string
          status?: Database["public"]["Enums"]["status_sala"] | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidade?: number | null
          created_at?: string | null
          equipamentos?: string[] | null
          id?: string
          medico_responsavel?: string | null
          nome?: string
          status?: Database["public"]["Enums"]["status_sala"] | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salas_medico_responsavel_fkey"
            columns: ["medico_responsavel"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_atestado: {
        Row: {
          cid: string | null
          conteudo: string | null
          created_at: string | null
          criado_por: string | null
          dias_afastamento: number | null
          id: string
          nome: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          cid?: string | null
          conteudo?: string | null
          created_at?: string | null
          criado_por?: string | null
          dias_afastamento?: number | null
          id?: string
          nome: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          cid?: string | null
          conteudo?: string | null
          created_at?: string | null
          criado_por?: string | null
          dias_afastamento?: number | null
          id?: string
          nome?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      templates_prescricao: {
        Row: {
          created_at: string | null
          criado_por: string | null
          id: string
          medicamentos: Json | null
          nome: string
          observacoes_gerais: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          id?: string
          medicamentos?: Json | null
          nome: string
          observacoes_gerais?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          id?: string
          medicamentos?: Json | null
          nome?: string
          observacoes_gerais?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      triagens: {
        Row: {
          agendamento_id: string
          altura: number | null
          classificacao_risco:
            | Database["public"]["Enums"]["classificacao_risco"]
            | null
          created_at: string | null
          data_hora: string | null
          enfermeiro_id: string
          frequencia_cardiaca: number | null
          frequencia_respiratoria: number | null
          id: string
          imc: number | null
          observacoes: string | null
          paciente_id: string
          peso: number | null
          pressao_arterial: string | null
          queixa_principal: string | null
          saturacao: number | null
          temperatura: number | null
          updated_at: string | null
        }
        Insert: {
          agendamento_id: string
          altura?: number | null
          classificacao_risco?:
            | Database["public"]["Enums"]["classificacao_risco"]
            | null
          created_at?: string | null
          data_hora?: string | null
          enfermeiro_id: string
          frequencia_cardiaca?: number | null
          frequencia_respiratoria?: number | null
          id?: string
          imc?: number | null
          observacoes?: string | null
          paciente_id: string
          peso?: number | null
          pressao_arterial?: string | null
          queixa_principal?: string | null
          saturacao?: number | null
          temperatura?: number | null
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string
          altura?: number | null
          classificacao_risco?:
            | Database["public"]["Enums"]["classificacao_risco"]
            | null
          created_at?: string | null
          data_hora?: string | null
          enfermeiro_id?: string
          frequencia_cardiaca?: number | null
          frequencia_respiratoria?: number | null
          id?: string
          imc?: number | null
          observacoes?: string | null
          paciente_id?: string
          peso?: number | null
          pressao_arterial?: string | null
          queixa_principal?: string | null
          saturacao?: number | null
          temperatura?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triagens_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triagens_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_clinical: { Args: { _user_id: string }; Returns: boolean }
      can_access_financial: { Args: { _user_id: string }; Returns: boolean }
      can_manage_data: { Args: { _user_id: string }; Returns: boolean }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_enfermagem: { Args: { _user_id: string }; Returns: boolean }
      is_financeiro: { Args: { _user_id: string }; Returns: boolean }
      is_medico: { Args: { _user_id: string }; Returns: boolean }
      is_recepcao: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "medico" | "recepcao" | "enfermagem" | "financeiro"
      classificacao_risco: "verde" | "amarelo" | "laranja" | "vermelho"
      status_agendamento:
        | "agendado"
        | "confirmado"
        | "aguardando"
        | "em_atendimento"
        | "finalizado"
        | "cancelado"
        | "faltou"
      status_exame:
        | "solicitado"
        | "agendado"
        | "realizado"
        | "laudo_disponivel"
        | "cancelado"
      status_pagamento:
        | "pendente"
        | "pago"
        | "cancelado"
        | "estornado"
        | "atrasado"
      status_sala: "disponivel" | "ocupado" | "manutencao" | "limpeza"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "medico", "recepcao", "enfermagem", "financeiro"],
      classificacao_risco: ["verde", "amarelo", "laranja", "vermelho"],
      status_agendamento: [
        "agendado",
        "confirmado",
        "aguardando",
        "em_atendimento",
        "finalizado",
        "cancelado",
        "faltou",
      ],
      status_exame: [
        "solicitado",
        "agendado",
        "realizado",
        "laudo_disponivel",
        "cancelado",
      ],
      status_pagamento: [
        "pendente",
        "pago",
        "cancelado",
        "estornado",
        "atrasado",
      ],
      status_sala: ["disponivel", "ocupado", "manutencao", "limpeza"],
    },
  },
} as const
