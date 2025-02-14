from django import forms
from .models import Fiscalizacao


class formulario_1(forms.Form):
    class Meta:
        model = Fiscalizacao
        fields = ['codigo_propriedade',
            'ui',
            'parcela_t',
            'codigo_ut',
            'fiscal_responsavel',
            'municipio',
            'empresa',
            'mes_medicao',
            'metodo',
            'id_parcela',
            'fase',
            'atividades',
            'area_medicao_ha',
            'espacamento',
            'nota',
            'quantidade',
            'observacao',
        ]


