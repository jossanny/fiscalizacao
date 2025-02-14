from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from django.contrib import messages
import json
from .models import Fiscalizacao


@csrf_exempt
def home(request):
    if request.method == "POST":
        try:
            # Campos fora da tabela
            codigo_propriedade = request.POST.get('codigo_propriedade')
            if not codigo_propriedade:
                raise ValidationError("Código da propriedade é obrigatório.")

            codigo_ut = request.POST.get('codigo_ut')
            ui = request.POST.get('ui')
            parcela_t = request.POST.get('parcela_t')
            fiscal_responsavel = request.POST.get('fiscal_responsavel')
            municipio = request.POST.get('municipio')
            empresa = request.POST.get('empresa')
            mes_medicao = request.POST.get('mes_medicao')
            metodo = request.POST.get('metodo')

            # Campos da tabela
            id_parcela_list = request.POST.getlist('id_parcela[]')
            if not id_parcela_list:
                raise ValidationError(
                    "Pelo menos uma parcela deve ser informada.")

            fase_list = request.POST.getlist('fase[]')
            atividades_list = request.POST.getlist('atividades[]')
            area_medicao_ha_list = request.POST.getlist('area_medicao_ha[]')
            espacamento_list = request.POST.getlist('espacamento[]')
            nota_list = request.POST.getlist('nota[]')
            quantidade_list = request.POST.getlist('quantidade[]')
            observacao_list = request.POST.getlist('observacao[]')

            # Criar uma lista de instâncias do modelo
            fiscalizacoes = []
            for i in range(len(id_parcela_list)):
                fiscalizacao = Fiscalizacao(
                    codigo_propriedade=codigo_propriedade,
                    ui=ui,
                    parcela_t=parcela_t,
                    codigo_ut=codigo_ut,
                    fiscal_responsavel=fiscal_responsavel,
                    municipio=municipio,
                    empresa=empresa,
                    mes_medicao=mes_medicao,
                    metodo=metodo,
                    id_parcela=id_parcela_list[i],
                    fase=fase_list[i],
                    atividades=atividades_list[i],
                    area_medicao_ha=area_medicao_ha_list[i],
                    espacamento=espacamento_list[i],
                    nota=nota_list[i],
                    quantidade=quantidade_list[i],
                    observacao=observacao_list[i]
                )
                fiscalizacoes.append(fiscalizacao)

            # Inserir todos os registros de uma vez
            try:
                Fiscalizacao.objects.bulk_create(fiscalizacoes)
                messages.success(request, "Dados salvos com sucesso!")
            except Exception as e:
                messages.error(request, f"Erro ao salvar os dados: {str(e)}")
                return redirect('home')

            return redirect('formulario')
        except ValidationError as e:
            messages.error(request, str(e))
            return redirect('home')
    else:
        return render(request, 'home.html')


def formulario(request):
    return render(request, 'formulario.html')


@csrf_exempt
def sync_data(request):
    if request.method == "POST":
        try:
            # Decodifica os dados JSON enviados
            data = json.loads(request.body)
            print("Dados recebidos para sincronização:", data)  # Depuração

            # Verifica se os dados são uma lista de listas
            if not isinstance(data, list) or not all(isinstance(item, list) for item in data):
                return JsonResponse({"status": "error", "message": "Dados devem ser uma lista de listas"}, status=400)

            # Validação dos campos necessários
            required_fields = [
                'codigo_propriedade', 'ui', 'parcela_t', 'codigo_ut', 'fiscal_responsavel',
                'municipio', 'empresa', 'mes_medicao', 'metodo',
                'id_parcela', 'fase', 'atividades'
            ]

            optional_fields = [
                'area_medicao_ha',
                'espacamento', 'nota', 'quantidade', 'observacao'
            ]

            # Itera sobre a lista de listas
            for sublist in data:
                for item in sublist:
                    for field in required_fields:
                        if field not in item:
                            raise ValidationError(f"{field} é obrigatório")

            for sublist in data:
                for item in sublist:
                    # Define valores None para campos opcionais se não forem enviados
                    for field in optional_fields:
                        if field not in item:
                            item[field] = None

            # Salvar os dados no banco de dados
            for sublist in data:
                for item in sublist:
                    Fiscalizacao.objects.create(**item)

            return JsonResponse({"status": "success", "message": "Dados sincronizados com sucesso!", "redirect_url": "/home/"}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"status": "error", "message": "Dados inválidos (JSON malformado)"}, status=400)
        except ValidationError as e:
            print("Erro de validação:", str(e))  # Depuração
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
        except Exception as e:
            print("Erro ao sincronizar dados:", str(e))  # Depuração
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Método não permitido"}, status=405)

        


