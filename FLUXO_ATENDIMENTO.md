# 📋 Fluxo Completo de Atendimento - EloLab

## 🚀 5 Passos do Atendimento

```
┌─────────────────────────────────────────────────────────────────┐
│  PACIENTE CHEGA NA CLÍNICA                                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 1: CHECK-IN ✅ (Recepção)                               │
│  • Receptionist registra chegada do paciente                    │
│  • Sistema add paciente à fila                                  │
│  • Paciente recebe número (posição na fila)                     │
│  • Mostra no painel quando é a vez                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
         Paciente vê no PAINEL TV: "Maria, dirija-se ao balcão"
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 2: BALCÃO / PAGAMENTO 💳 (Caixa)                         │
│  • Receptionist chama paciente ao balcão                        │
│  • Confirma dados e tipo de serviço                             │
│  • Registra forma de pagamento                                  │
│  • Gera RECIBO (impresso ou PDF)                                │
│  • Registra lançamento em Lancamentos                           │
│  • Status muda para "PAGAMENTO CONFIRMADO"                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓
       Sistema chama automaticamente: "Maria, dirija-se à Sala 1"
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 3: CHAMADA PARA SALA DE ATENDIMENTO 🏥                  │
│  • Painel TV: "MARIA - SALA 1"                                 │
│  • Som de alerta/campainha                                      │
│  • Luz pisca acima da porta da sala                             │
│  • Médico/Enfermeiro aguarda                                    │
│  • Status muda para "EM ATENDIMENTO"                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
        Médico realiza atendimento/consulta
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 4: FINALIZADO 📝 (Sala de Atendimento)                  │
│  • Médico finaliza atendimento                                  │
│  • Registra observações/prescrição se necessário                │
│  • Clica "Finalizar Atendimento"                                │
│  • Sistema registra: hora fim, duração, observações             │
│  • Status muda para "FINALIZADO"                                │
└─────────────────────────────────────────────────────────────────┘
                           ↓
        Sistema registra encerramento no banco
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 5: CONCLUÍDO / SAÍDA 👋                                  │
│  • Paciente liberado                                            │
│  • Removido da fila                                             │
│  • Se necessário: agendamento de retorno                        │
│  • Feedback/avaliação (opcional)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Responsabilidades por Tela

### **1. RECEPCAO.tsx** (Check-in & Balcão)
```
├─ Check-in
│  ├─ Pesquisar paciente por nome/CPF
│  ├─ Confirmar agendamento
│  └─ ADD à fila de atendimento
│
├─ Balcão (Pagamento)
│  ├─ Listar pacientes aguardando pagamento
│  ├─ Confirmar forma de pagamento
│  ├─ Gerar recibo
│  └─ Liberar para atendimento
│
└─ Fila Visual
   ├─ Mostrar posição na fila
   ├─ Tempo de espera
   └─ Status do paciente
```

### **2. PAINEL TV** (Chamadas)
```
├─ Mostra em tempo real:
│  ├─ Próximo paciente a chamar
│  ├─ Sala designada
│  ├─ Nome e número
│  └─ Efeito sonoro/visual
│
└─ Atualiza automaticamente cada 10s
```

### **3. FILA.tsx** (Gerenciamento)
```
├─ Visualizar toda fila
├─ Chamar paciente para:
│  ├─ Balcão (se não pagou)
│  └─ Sala (se pagou)
├─ Iniciar atendimento
├─ Finalizar atendimento
└─ Remover da fila (se necessário)
```

### **4. SALA DE ATENDIMENTO** (Consulta/Atendimento)
```
├─ Médico vê paciente
├─ Registra:
│  ├─ Queixa/sintomas
│  ├─ Observações
│  ├─ Prescrição
│  └─ Próximos passos
│
└─ Clica "Finalizar Atendimento"
```

---

## 💾 Registros Criados em Cada Passo

### **Passo 1: CHECK-IN**
```sql
INSERT INTO fila_atendimento (
  agendamento_id, paciente_id, status, posicao, criado_em
) VALUES (...)
-- Status: 'aguardando'
```

### **Passo 2: PAGAMENTO**
```sql
INSERT INTO lancamentos (
  paciente_id, descricao, valor, forma_pagamento, status
) VALUES (...)
-- Cria recibo PDF
-- Atualiza fila_atendimento status para 'pagamento_confirmado'
```

### **Passo 3: CHAMADA PARA SALA**
```sql
UPDATE fila_atendimento SET 
  sala_id = '...', 
  status = 'em_atendimento',
  hora_chamada = now()
WHERE id = '...'
```

### **Passo 4: FINALIZADO**
```sql
UPDATE fila_atendimento SET 
  status = 'finalizado',
  hora_finalizacao = now(),
  duracao_minutos = (now() - hora_inicio)
WHERE id = '...'

INSERT INTO prontuario_consulta (
  paciente_id, medico_id, observacoes, ...
) VALUES (...)
```

---

## 🔄 Automações Ativas

### 1. **Auto Check-in** (Se agendado)
```
Quando paciente clica "Cheguei" no portal
→ Sistema faz check-in automático
→ Add à fila
```

### 2. **Auto Pagamento** 
```
Quando pagamento confirmado
→ Status muda automaticamente
→ Paciente chamado para sala
```

### 3. **Auto Chamada Painel**
```
Status = 'pagamento_confirmado'
→ Painel exibe nome + sala
→ Toca alerta sonoro
→ Blink luz da sala
```

### 4. **Auto Registro Prontuário**
```
Quando atendimento finalizado
→ Salva automaticamente no prontuário
→ Cria registro de consulta
→ Calcula duração
```

---

## 📊 Visualização em Tempo Real

### **Painel TV (PainelTV.tsx)**
```
┌────────────────────────────────────┐
│                                    │
│    PRÓXIMA CHAMADA:                │
│    ┌──────────────────────────┐   │
│    │                          │   │
│    │    MARIA DOS SANTOS      │   │
│    │    SALA 1                │   │
│    │                          │   │
│    └──────────────────────────┘   │
│                                    │
│    ⏱️  Tempo de espera: 12 min      │
│    👥 Fila: 3 pessoas antes        │
│                                    │
└────────────────────────────────────┘
```

### **Dashboard (Dashboard.tsx)**
```
┌─ Resumo do Dia
├─ Total check-ins: 24
├─ Aguardando pagamento: 3
├─ Em atendimento: 2
├─ Finalizados: 19
└─ Tempo médio espera: 18min
```

---

## ⚙️ Configurações Necessárias

### **Salas** (Configuracoes.tsx)
- Nome: "Sala 1", "Sala 2", etc
- Tipo: Consulta, Triagem, Procedimento
- Equipamentos (opcional)

### **Painel TV** (PainelTV.tsx)
- URL: `http://clinica-ip:3000/painel-tv`
- Tamanho full-screen
- Atualização automática
- Alerta sonoro (opcional)

---

## 🎙️ Voz de Chamada

Sistema usa síntese de voz para chamar:
```
"Paciente Maria dos Santos, por favor dirija-se à Sala 1"
```

Pode ser customizado em `Fila.tsx` função `chamarPacienteVoz()`

---

## 📈 KPIs Rastreados

- ⏱️ Tempo médio de espera
- 🏥 Ocupação de salas
- 👥 Taxa de no-show
- 💰 Total coletado
- 📊 Tempo médio de atendimento por médico
- 🎯 Satisfação do paciente

