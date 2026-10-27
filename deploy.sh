#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

skip_build=false
case "${1:-}" in
  '') ;;
  --skip-build) skip_build=true ;;
  *) echo 'Uso: yarn deploy [--skip-build]'; exit 1 ;;
esac

SECONDS=0
deploy_cache_dir=''
progress_pid=''
cleanup() {
  if [[ -n "$progress_pid" ]]; then
    kill "$progress_pid" 2>/dev/null || true
    wait "$progress_pid" 2>/dev/null || true
  fi
  if [[ -n "$deploy_cache_dir" ]]; then
    rm -rf -- "$deploy_cache_dir"
  fi
}
trap cleanup EXIT
trap 'printf "\nDeploy interrompido.\n"; exit 130' INT TERM
trap 'printf "\n[ERRO] Deploy falhou após %ss. Confira a mensagem acima.\n" "$SECONDS" >&2' ERR

printf '\n[1/3] Conferindo o repositório...\n'
deploy_repo_url="$(git remote get-url origin)" || { echo 'Configure o repositório remoto origin antes de publicar.'; exit 1; }
printf 'Destino: %s\nBranch de publicação: gh-pages\n' "$deploy_repo_url"

if "$skip_build"; then
  printf '\n[2/3] Usando o build existente em dist/.\n'
  if [[ ! -f dist/index.html ]]; then
    echo '[ERRO] Build não encontrado. Execute yarn deploy sem --skip-build.' >&2
    exit 1
  fi
else
  printf '\n[2/3] Gerando a versão de produção...\n'
  yarn run build
fi
printf 'Tamanho da publicação: %s\n' "$(du -sh dist | cut -f1)"

# Keep the temporary Git checkout outside mounted drives with different ownership.
deploy_cache_dir="$(mktemp -d "${TMPDIR:-/tmp}/continuous-pages.XXXXXX")"
printf '\n[3/3] Publicando no GitHub...\n'
printf 'Os logs abaixo mostram as etapas de clonagem, cópia, commit e envio.\n'
printf 'O envio dos áudios pode demorar; o tempo decorrido será exibido a cada 10s.\n\n'
(
  while true; do
    sleep 10
    printf '[Em andamento · %ss] Aguardando o Git concluir a publicação...\n' "$SECONDS"
  done
) &
progress_pid=$!

CACHE_DIR="$deploy_cache_dir" NODE_DEBUG="${NODE_DEBUG:+$NODE_DEBUG,}gh-pages" yarn run gh-pages -d dist --repo "$deploy_repo_url"
kill "$progress_pid" 2>/dev/null || true
wait "$progress_pid" 2>/dev/null || true
progress_pid=''

printf '\n[OK] Arquivos enviados para gh-pages em %ss.\n' "$SECONDS"
printf 'Site: https://lucasfujarra.github.io/Continuous/\n'
printf 'Acompanhe a ativação no GitHub: https://github.com/LucasFujarra/Continuous/actions\n'
printf 'Em Settings → Pages, selecione gh-pages / (root).\n'
