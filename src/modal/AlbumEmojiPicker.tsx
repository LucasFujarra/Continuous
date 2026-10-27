import EmojiPicker from 'emoji-picker-react';
import portugueseEmojis from 'emoji-picker-react/data/emojis-pt';

interface AlbumEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function AlbumEmojiPicker({ onSelect }: AlbumEmojiPickerProps) {
  return <div className="album-emoji-picker">
    <EmojiPicker
      colorScheme="dark"
      emojiStyle="native"
      emojiData={portugueseEmojis}
      width="100%"
      height={350}
      autoFocusSearch={false}
      previewConfig={{ showPreview: false }}
      labels={{
        searchPlaceholder: 'Buscar emoji…',
        searchLabel: 'Buscar emoji',
        searchClear: 'Limpar busca',
        searchResultsNone: 'Nenhum emoji encontrado',
        searchResultsOne: 'Um emoji encontrado',
        searchResultsMany: '%n emojis encontrados',
        categoryNavigation: 'Categorias de emojis',
        loading: 'Carregando emojis…',
        loadingError: 'Não foi possível carregar os emojis.',
        retryLoading: 'Tentar novamente',
        skinToneNeutral: 'Tom de pele padrão',
        skinToneLight: 'Tom de pele claro',
        skinToneMediumLight: 'Tom de pele médio claro',
        skinToneMedium: 'Tom de pele médio',
        skinToneMediumDark: 'Tom de pele médio escuro',
        skinToneDark: 'Tom de pele escuro',
      }}
      onEmojiClick={data => onSelect(data.emoji)}
    />
  </div>;
}
