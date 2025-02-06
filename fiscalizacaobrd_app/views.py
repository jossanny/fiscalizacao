from django.shortcuts import render, redirect
from .models import Fiscalizacao

def home(request):
    if request.method == "POST":
        # Campos fora da tabela
        codigo_propriedade = request.POST.get('codigo_propriedade')
        codigo_ut = request.POST.get('codigo_ut')
        fiscal_responsavel = request.POST.get('fiscal_responsavel')
        municipio = request.POST.get('municipio')
        empresa = request.POST.get('empresa')
        mes_medicao = request.POST.get('mes_medicao')
        metodo = request.POST.get('metodo')

        # Campos da tabela
        id_parcela_list = request.POST.getlist('id_parcela[]')
        fase_list = request.POST.getlist('fase[]')
        atividades_list = request.POST.getlist('atividades[]')
        area_medicao_ha_list = request.POST.getlist('area_medicao_ha[]')
        espacamento_list = request.POST.getlist('espacamento[]')
        nota_list = request.POST.getlist('nota[]')
        quantidade_list = request.POST.getlist('quantidade[]')
        observacao_list = request.POST.getlist('observacao[]')

        # Criar instâncias do modelo para os dados da tabela
        for i in range(len(id_parcela_list)):
            Fiscalizacao.objects.create(
                codigo_propriedade=codigo_propriedade,
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

        return render(request, 'formulario.html', {'message': 'Dados salvos com sucesso!'})
    else:
        # Caso seja um GET, apenas renderiza o formulário vazio
        return render(request, 'home.html')

def formulario(request):
    # Apenas renderiza uma página de sucesso após salvar os dados
    return render(request, 'formulario.html')