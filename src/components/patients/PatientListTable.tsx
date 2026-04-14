import { memo } from 'react';
import { Eye, Edit, Trash2, Link, Phone, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PatientPhoto, AllergyAlert } from '@/components/clinical';

interface PatientListTableProps {
  pacientes: any[];
  onView: (paciente: any) => void;
  onEdit: (paciente: any) => void;
  onDelete: (paciente: any) => void;
  onGeneratePortalLink: (id: string, nome: string) => void;
  getConvenioNome: (id: string | null) => string;
  calcularIdade: (data: string | null) => number;
}

export const PatientListTable = memo(function PatientListTable({
  pacientes, onView, onEdit, onDelete, onGeneratePortalLink, getConvenioNome, calcularIdade,
}: PatientListTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead className="hidden md:table-cell">CPF</TableHead>
            <TableHead className="hidden sm:table-cell">Contato</TableHead>
            <TableHead className="hidden lg:table-cell">Convênio</TableHead>
            <TableHead className="hidden lg:table-cell">Idade</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pacientes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Nenhum paciente encontrado
              </TableCell>
            </TableRow>
          ) : (
            pacientes.map((paciente) => {
              const idade = calcularIdade(paciente.data_nascimento);
              return (
                <TableRow key={paciente.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(paciente)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PatientPhoto
                        pacienteId={paciente.id}
                        pacienteNome={paciente.nome}
                        currentPhotoUrl={paciente.foto_url}
                        size="sm"
                        editable={false}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{paciente.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {paciente.sexo && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {['M', 'masculino'].includes(paciente.sexo) ? 'M' : ['F', 'feminino'].includes(paciente.sexo) ? 'F' : 'O'}
                            </Badge>
                          )}
                          {idade < 18 && <Badge className="bg-amber-500/10 text-amber-700 text-[10px] px-1.5 py-0">Menor</Badge>}
                        </div>
                        {paciente.alergias && paciente.alergias.length > 0 && (
                          <AllergyAlert alergias={paciente.alergias} compact className="mt-1" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{paciente.cpf || '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="space-y-0.5 text-sm">
                      {paciente.telefone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" />{paciente.telefone}
                        </div>
                      )}
                      {paciente.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[180px]">
                          <Mail className="h-3 w-3" />{paciente.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {getConvenioNome(paciente.convenio_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm tabular-nums">
                      {paciente.data_nascimento ? `${idade} anos` : <span className="text-muted-foreground">N/I</span>}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onView(paciente)} title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onGeneratePortalLink(paciente.id, paciente.nome)} title="Link do portal">
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(paciente)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(paciente)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
});
