# Continuous

Aplicação web responsiva em React + TypeScript + Vite, baseada nas funções do Pads e na estrutura de publicação do poker-air. Funciona no navegador de computadores e celulares.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Para acessar pelo celular na mesma rede, use o IP do computador e a porta exibida. `npm run check` verifica os tipos; `npm test` verifica a lógica musical (Node 22.18+); `npm run build` gera `dist`; `npm run preview` permite conferir a versão de produção. Use Node 22.18 ou superior. O primeiro `npm install` com acesso à internet gera o lockfile deste projeto.

## Seus áudios

Coloque os arquivos em `assets/PAD/Nome da pasta/`. Exemplo:

```text
assets/PAD/
  Ambient/
    C.aac
    Csus.aac
    D.aac
  Guitar/
    C.mp3
```

Não há pads incluídos inicialmente. A biblioteca é descoberta automaticamente pelo Vite; após adicionar arquivos, recarregue o desenvolvimento ou faça novo build/publicação. Também é possível abrir uma pasta pelo botão da interface: os arquivos são usados localmente, sem upload, e precisam ser selecionados novamente ao recarregar a página. O seletor de pastas depende do suporte do navegador.

Extensões reconhecidas: MP3, WAV, OGG, AAC, M4A, MP4, FLAC, OPUS e WEBM. A reprodução usa o decodificador nativo do navegador via HTMLAudioElement e Web Audio, sem ffmpeg, conversão ou cache WAV. Reconhecer a extensão não garante suporte ao codec: AAC e outros formatos dependem do navegador e do sistema. Arquivos incompatíveis exibem um aviso. O loop usa o mecanismo nativo do navegador; continuidade sem intervalo depende do arquivo e do decodificador.

Como no Python, `Csus` é interpretado como `C#` (convenção dos arquivos originais). O modo menor exibe o relativo menor do tom maior, sem alterar o áudio: C → Am. Arquivos de tom menor são mapeados ao relativo maior. Nomes fora da escala cromática mantêm o nome original. Se houver arquivos equivalentes para o mesmo tom, o primeiro em ordem de nome é utilizado.

Clique no tom para iniciar em loop; clique novamente para parar com fade de 1,2 segundo. A navegação entre pastas mantém a reprodução. O volume é salvo no dispositivo.

## Publicação no GitHub Pages

Após criar o repositório, configurar `origin` e enviar o código:

```bash
npm run deploy
```

O script faz o build e publica somente `dist` na branch `gh-pages`, sem modificar a branch de desenvolvimento. No repositório, configure **Settings → Pages → Deploy from a branch → gh-pages / (root)**. A base relativa permite usar o nome escolhido para o repositório. Os áudios são arquivos separados no build, carregados quando selecionados. Considere o tamanho total da biblioteca e os limites da hospedagem ao publicar. Nenhum repositório ou deploy foi criado automaticamente.
