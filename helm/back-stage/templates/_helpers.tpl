{{/* Nome base do release */}}
{{- define "back-stage.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Nome totalmente qualificado */}}
{{- define "back-stage.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/* Labels comuns */}}
{{- define "back-stage.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "back-stage.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/* Selector labels base */}}
{{- define "back-stage.selectorLabels" -}}
app.kubernetes.io/name: {{ include "back-stage.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/* Service account name */}}
{{- define "back-stage.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{ default (include "back-stage.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
{{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/* Nome do Secret */}}
{{- define "back-stage.secretName" -}}
{{- default (printf "%s-secret" (include "back-stage.fullname" .)) .Values.secret.name -}}
{{- end -}}
