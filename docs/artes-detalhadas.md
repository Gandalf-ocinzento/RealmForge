# Artes conceituais detalhadas — RealmForge

As quatro artes desta pasta foram criadas para substituir a aparência básica dos mapas gerados inicialmente. São ilustrações originais geradas por IA, inspiradas em descrições gerais de fantasia medieval.

## Arquivos

| Cena | Arquivo | Descrição |
|---|---|---|
| Hobbiton | [hobbiton.webp](../../apps/web/public/maps/art/hobbiton.webp) | Vila verdejante, casas nas colinas, pontes, hortas, caminhos e praça central |
| Bri | [bree.webp](../../apps/web/public/maps/art/bree.webp) | Vila murada com estalagem, mercado, casas e estábulos |
| Valfenda | [rivendell.webp](../../apps/web/public/maps/art/rivendell.webp) | Refúgio élfico, cascatas, pontes, salões e jardins |
| Moria | [moria.webp](../../apps/web/public/maps/art/moria.webp) | Complexo subterrâneo com pilares, escadarias, pontes e abismos |

Todas as artes são **WebP 1448 × 1086**, otimizadas para o navegador (qualidade 80). Os PNGs originais permanecem fora do repositório nesta etapa; nenhuma imagem oficial de filmes ou atlas foi copiada.

## Estado da integração

Estas imagens são apresentadas pelo botão **Ver arte detalhada** no painel da região quando o jogador visita uma das quatro cenas. Elas **não substituem automaticamente a malha de colisões e navegação** porque a geometria dos caminhos, casas e paredes na arte ainda não corresponde às coordenadas dos mapas procedurais.

### Próxima etapa

Para torná-las mapas verdadeiramente jogáveis:
1. Definir escala e coordenadas entre imagem e grade.
2. Marcar polígonos/células navegáveis, paredes, margens de rio e desníveis.
3. Separar portas, objetos e personagens em camadas próprias.
4. Criar interiores e portais posicionados exatamente nas entradas ilustradas.
5. Testar movimentação e colisão contra a arte final.

### Direitos

A utilização comercial de nomes, personagens e cenários de Tolkien depende de direitos e licenciamento aplicáveis. As imagens geradas para o protótipo não representam autorização para explorar comercialmente uma adaptação.
