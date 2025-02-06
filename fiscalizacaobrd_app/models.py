from django.db import models
from django.core.exceptions import ValidationError


class Fiscalizacao(models.Model):
    OPCOES_NOTAS = [
        ("refazer_50", "Refazer (50%)"),
        ("razoavel_70", "Razoável (70%)"),
        ("adequado_100", "Adequado (100%)"),
    ]

    OPCOES_MUNICIPIOS = [
        ("afonso_claudio", "Afonso Cláudio"),
        ("baixo_guandu", "Baixo Guandu"),
        ("brejetuba", "Brejetuba"),
        ("colatina", "Colatina"),
        ("laranja_da_terra", "Laranja da Terra"),
        ("santa_teresa", "Santa Teresa"),
        ("sao_roque", "São Roque"),
    ]

    OPCOES_EMPRESAS = [
        ("inoversa", "Inoversa"),
        ("reflore", "Reflore"),
        ("genese", "Gênese"),
        ("sartori", "Sartori"),
        ("vital", "Vital"),
    ]

    OPCOES_MES = [
        ("JAN_2025", "JAN 2025"),
        ("FEV_2025", "FEV 2025"),
        ("MAR_2025", "MAR 2025"),
        ("ABR_2025", "ABR 2025"),
        ("MAI_2025", "MAI 2025"),
        ("JUN_2025", "JUN 2025"),
        ("JUL_2025", "JUL 2025"),
        ("AGO_2025", "AGO 2025"),
        ("SET_2025", "SET 2025"),
        ("OUT_2025", "OUT 2025"),
        ("NOV_2025", "NOV 2025"),
        ("DEZ_2025", "DEZ 2025"),
    ]

    OPCOES_ATIVIDADES = [
        ("preparo_mecanizado", "Preparo mecanizado"),
        ("alinhamento_marcacao", "Alinhamento e Marcação"),
        ("capina_quimica", "Capina Química"),
        ("controle_formiga", "Controle de Formiga"),
        ("rocada", "Roçada"),
        ("bercos_quali_quanti", "Berços - Qualidade e Quantidade"),
        ("micro_covas_quali_quanti", "Micro-covas - Qualidade e Quantidade"),
        ("calagem_berco", "Calagem (Berços)"),
        ("adubacao_plantio", "Adubação de Plantio"),
        ("plantio_replantio_mudas", "Plantio/Replantio de Mudas"),
        ("semeadura", "Semeadura Direta"),
        ("adubacao_cobertura_regenerantes", "Adubação de Cobertura/Regenerantes"),
        ("coroamento", "Coroamento")
    ]

    # Campos Existentes
    codigo_propriedade = models.CharField(max_length=10, blank=True, null=True)
    codigo_ut = models.IntegerField(blank=True, null=True)
    fiscal_responsavel = models.CharField(max_length=50, blank=True, null=True)
    municipio = models.CharField(
        max_length=50, choices=OPCOES_MUNICIPIOS, blank=True, null=True)
    empresa = models.CharField(
        max_length=50, choices=OPCOES_EMPRESAS, blank=True, null=True)
    mes_medicao = models.CharField(
        max_length=50, choices=OPCOES_MES, blank=True, null=True)
    metodo = models.CharField(max_length=50, choices=[(
        'Plantio Total', 'Plantio Total'), ('CRN', 'CRN')], blank=True, null=True)
    id_parcela = models.IntegerField(blank=True, null=True)
    fase = models.CharField(max_length=50, choices=[(
        'Implantacao', 'Implantação'), ('Manutencao', 'Manutenção')], blank=True, null=True)
    atividades = models.CharField(
        max_length=50, choices=OPCOES_ATIVIDADES, blank=True, null=True)
    area_medicao_ha = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True)
    espacamento = models.CharField(max_length=50, blank=True, null=True)
    nota = models.CharField(
        max_length=50, choices=OPCOES_NOTAS, blank=True, null=True)
    quantidade = models.IntegerField(blank=True, null=True)
    observacao = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.id_parcela} - {self.cod_prop} ({self.municipio})"
