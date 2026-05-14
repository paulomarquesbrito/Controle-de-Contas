# Meu Controle Financeiro

Um PWA local para controle financeiro pessoal.

Este app foi feito para celular, com visual de app nativo, navegação inferior, cards grandes, botões fáceis de tocar e dados salvos somente no seu dispositivo.

## 1. O Que Este App Faz

O Meu Controle Financeiro ajuda você a controlar:

- contas do mês;
- contas recorrentes, como energia, água, aluguel e internet;
- contas manuais;
- cartões;
- faturas mensais;
- compras parceladas;
- importação conferida de fatura em texto simples;
- categorias;
- regras aprendidas de categorização;
- dinheiro guardado mês a mês;
- relatórios;
- backup manual em JSON;
- avisos internos;
- notificações locais quando o navegador permitir.

Ele não tem backend, não tem login, não envia dados para servidor e não usa OCR.

## 2. Aviso Importante Sobre Seus Dados

Seus dados ficam salvos apenas neste dispositivo, dentro do navegador, usando IndexedDB.

Isso é bom para privacidade, mas exige cuidado:

- se você limpar os dados do navegador, pode perder tudo;
- se trocar de celular sem backup, pode perder tudo;
- se desinstalar o PWA e apagar os dados do navegador, pode perder tudo;
- exporte backups regularmente pelo menu Configurações.

## 3. O Que É Cada Tecnologia

### React

React é a biblioteca usada para criar as telas do app. Pense nela como o sistema que organiza botões, formulários, cards e páginas.

### Vite

Vite é a ferramenta que roda o app no seu computador enquanto você desenvolve e também gera a versão final para uso.

### Tailwind CSS

Tailwind é a ferramenta de estilo visual. Ele ajuda a criar espaçamentos, cores, botões, cards e layout mobile sem escrever CSS gigante.

### IndexedDB

IndexedDB é um banco de dados que já existe no navegador. Ele salva as informações localmente no computador ou celular.

### PWA

PWA significa Progressive Web App. É um site/app que pode ser instalado no celular pelo navegador e pode funcionar offline depois de carregado.

## 4. Estrutura Do Projeto

```txt
src/
├── components/      Componentes reutilizáveis, como cards, modal, menu inferior
├── data/            Categorias iniciais e dados padrão
├── db/              IndexedDB e backup
├── hooks/           Carregamento central dos dados
├── layouts/         Reservado para layouts futuros
├── pages/           Telas principais do app
├── parsers/         Leitores de fatura em texto
├── services/        Regras de negócio
├── styles/          CSS global e Tailwind
└── utils/           Funções de data, dinheiro, texto e ids
```

Arquivos importantes:

- `src/db/indexedDb.js`: cria e acessa o banco local.
- `src/db/backupService.js`: exporta e importa backup JSON.
- `src/parsers/genericInvoiceParser.js`: parser inicial de faturas.
- `src/parsers/parserRegistry.js`: lista de parsers disponíveis.
- `public/manifest.webmanifest`: configura instalação do PWA.
- `public/sw.js`: service worker para cache e funcionamento offline.

## 5. Como Instalar O Node.js

Node.js é necessário para rodar o projeto no computador.

1. Acesse `https://nodejs.org/`.
2. Baixe a versão recomendada ou LTS.
3. Instale clicando em Avançar até finalizar.
4. Feche e abra o terminal novamente.

Para conferir se instalou:

```bash
node -v
```

Se aparecer um número de versão, deu certo.

## 6. Como Abrir O Terminal No Windows

Você pode usar PowerShell, Prompt de Comando ou Terminal do Windows.

Forma simples:

1. Abra a pasta do projeto.
2. Clique na barra de endereço da pasta.
3. Digite `cmd`.
4. Aperte Enter.

Isso abre o terminal já dentro da pasta.

## 7. Como Entrar Na Pasta Do Projeto

Se você abriu o terminal em outro lugar, use:

```bash
cd "C:\Users\paulo\OneDrive\Área de Trabalho\Carteira Inteligente"
```

As aspas são importantes porque o caminho tem espaços e acentos.

## 8. Como Instalar As Dependências

Dentro da pasta do projeto, rode:

```bash
npm install
```

Se o PowerShell bloquear o comando `npm`, use:

```bash
npm.cmd install
```

O que esse comando faz:

- baixa React;
- baixa Vite;
- baixa Tailwind;
- baixa os ícones;
- cria a pasta `node_modules`.

## 9. Como Rodar O App No Computador

Depois de instalar as dependências, rode:

```bash
npm run dev
```

No Windows, se precisar:

```bash
npm.cmd run dev
```

O terminal vai mostrar um endereço parecido com:

```txt
http://localhost:5173
```

Abra esse endereço no navegador.

## 10. O Que Cada Comando Faz

```bash
npm install
```

Instala as dependências do projeto.

```bash
npm run dev
```

Roda o app em modo de desenvolvimento.

```bash
npm run build
```

Gera a versão final do app na pasta `dist`.

```bash
npm run preview
```

Roda a versão final gerada pelo build para testar como PWA.

## 11. Como Testar No Celular Pela Mesma Rede Wi-Fi

1. Conecte o computador e o celular na mesma rede Wi-Fi.
2. No computador, rode:

```bash
npm run dev
```

3. Descubra o IP do computador.

No Windows, rode:

```bash
ipconfig
```

Procure por `Endereço IPv4`, algo como:

```txt
192.168.0.10
```

4. No celular, abra o navegador e acesse:

```txt
http://SEU-IP:5173
```

Exemplo:

```txt
http://192.168.0.10:5173
```

Observação: algumas funções de PWA e notificação podem exigir HTTPS ou localhost. Testar pelo IP local é ótimo para ver o layout no celular, mas a instalação e notificações dependem do navegador.

## 12. Como Instalar Como PWA No Celular

O melhor teste de instalação é com a versão final:

```bash
npm run build
npm run preview
```

Depois acesse o endereço mostrado pelo `preview`.

No app, abra Configurações e procure a seção Instalação do PWA. Se o navegador liberar a instalação, o botão Instalar app ficará ativo.

No Android com Chrome:

1. Abra o app no Chrome.
2. Toque nos três pontos.
3. Toque em Instalar app ou Adicionar à tela inicial.
4. Confirme.

Importante:

- `http://localhost` costuma ser aceito para instalar no computador.
- `http://IP-DO-COMPUTADOR:porta` no celular pode não ser aceito, porque não é HTTPS.
- se o botão Instalar app não aparecer, use o menu do navegador: Instalar app ou Adicionar à tela inicial.
- o manifest usa ícones PNG 192x192 e 512x512, além de ícone maskable, para melhorar a compatibilidade.

## 12.1. Outra Forma Local Para Android: USB Com ADB

Se o celular não mostra a opção de instalar quando você acessa pelo IP do computador, existe uma alternativa local muito boa: fazer o celular abrir o app como se fosse `localhost`.

Isso funciona porque navegadores tratam `localhost` como endereço seguro para desenvolvimento.

Resumo da ideia:

- o app roda no computador;
- o celular fica conectado por cabo USB;
- o comando `adb reverse` cria uma ponte;
- no celular, você abre `http://localhost:4173`;
- o navegador tem mais chance de liberar a instalação.

Passo a passo:

1. Instale o Android Platform Tools no computador.

   Baixe no site oficial do Android:

   `https://developer.android.com/tools/releases/platform-tools`

2. No celular Android, ative as Opções do desenvolvedor.

   Normalmente é assim:

   - Configurações;
   - Sobre o telefone;
   - toque várias vezes em Número da versão;
   - volte e procure Opções do desenvolvedor.

3. Ative Depuração USB.

4. Conecte o celular no computador com cabo USB.

5. No celular, aceite a mensagem de confiança do computador.

6. No computador, dentro da pasta do projeto, rode:

```bash
npm run build
npm run preview
```

Se estiver usando Windows PowerShell com bloqueio, use:

```bash
npm.cmd run build
npm.cmd run preview
```

7. Em outro terminal, rode:

```bash
adb reverse tcp:4173 tcp:4173
```

8. No Chrome do celular, abra:

```txt
http://localhost:4173
```

9. Abra o menu do Chrome e procure Instalar app ou Adicionar à tela inicial.

Se o comando `adb` não for reconhecido, significa que o Platform Tools não está no PATH. Nesse caso, abra o terminal dentro da pasta onde está o `adb.exe` ou adicione essa pasta ao PATH do Windows.

Essa opção continua sendo local: seus dados continuam no celular/navegador e nada é enviado para servidor externo.

## 12.2. Publicar No GitHub Pages

GitHub Pages é uma forma prática de abrir o app em HTTPS no celular. Isso costuma resolver o problema de o navegador não mostrar a opção de instalar.

O que fica público:

- o código do app;
- os arquivos estáticos gerados no build;
- ícones, CSS, JavaScript e HTML.

O que não fica público:

- suas contas;
- seus cartões;
- suas faturas importadas;
- seus backups;
- seus valores;
- seus dados salvos no IndexedDB.

Esses dados continuam no navegador/celular onde você usar o app. O GitHub Pages só hospeda o app vazio, como se fosse a “casca” do aplicativo.

Atenção: não coloque arquivos de backup `.json` no repositório. Backup financeiro deve ficar fora do GitHub.

Passo a passo básico:

1. Crie um repositório no GitHub.
2. Envie este projeto para o repositório.
3. No GitHub, abra Settings.
4. Abra Pages.
5. Em Build and deployment, escolha GitHub Actions.
6. Faça push para a branch `main`.
7. O arquivo `.github/workflows/deploy-pages.yml` vai gerar e publicar o app automaticamente.

O endereço ficará parecido com:

```txt
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

Depois abra esse endereço no Chrome do celular e use o menu do navegador para instalar.

Se o repositório for público, qualquer pessoa pode abrir o app vazio. Isso não dá acesso aos seus dados locais, mas outras pessoas poderiam usar uma cópia limpa do app no próprio navegador delas.

## 12.3. Cofre Familiar Criptografado No GitHub

O app também tem uma área chamada Cofre familiar no GitHub, dentro de Configurações.

Ela serve para você e sua esposa sincronizarem os mesmos dados sem transformar o GitHub em banco aberto.

Como funciona:

- o app cria um backup completo;
- esse backup é criptografado com uma senha escolhida por vocês;
- o arquivo criptografado é enviado para um repositório privado no GitHub;
- ao baixar, o app pede a senha e restaura os dados no IndexedDB local.

O GitHub guarda só o cofre fechado. A senha não é enviada para o GitHub.

### Regra De Uso

Como GitHub guarda um arquivo inteiro, não editem ao mesmo tempo.

Combinem este hábito:

```txt
Antes de mexer: Baixar do GitHub
Depois de mexer: Enviar para GitHub
```

Se o app perceber que o arquivo remoto mudou desde a última sincronização, ele bloqueia o envio normal e avisa. Existe botão de envio forçado, mas use só se tiver certeza.

### Criar Repositório Privado Para Os Dados

1. Entre no GitHub.
2. Crie um novo repositório.
3. Marque como Private.
4. Sugestão de nome:

```txt
meu-controle-financeiro-dados
```

5. Não coloque backups JSON abertos nesse repositório. O app vai criar um arquivo criptografado.

### Criar Token Fine-Grained

O app precisa de permissão para gravar o arquivo criptografado no seu repositório privado.

No GitHub:

1. Abra Settings.
2. Abra Developer settings.
3. Abra Personal access tokens.
4. Escolha Fine-grained tokens.
5. Crie um novo token.
6. Selecione somente o repositório privado dos dados.
7. Em permissões do repositório, dê acesso de leitura e escrita para Contents.
8. Gere o token.
9. Copie o token.

Guarde esse token com cuidado. Ele fica salvo localmente no aparelho em que você configurar o app.

### Configurar No App

No app, abra Configurações > Cofre familiar no GitHub.

Preencha:

- Usuário/owner: seu usuário do GitHub.
- Repositório: nome do repositório privado.
- Branch: normalmente `main`.
- Arquivo: pode deixar `data/encrypted-finance-data.json`.
- Token: token fine-grained do GitHub.
- Senha do cofre: senha combinada entre você e sua esposa.

Depois toque em:

```txt
Salvar configuração local
```

### Primeiro Envio

No aparelho que já tem os dados corretos:

1. Confira se tudo está certo no app.
2. Abra Configurações.
3. Vá em Cofre familiar no GitHub.
4. Digite a senha do cofre.
5. Toque em Enviar.

Isso cria o arquivo criptografado no GitHub.

### Segundo Aparelho

No aparelho da outra pessoa:

1. Abra o app instalado.
2. Configure o mesmo repositório, token e senha.
3. Toque em Baixar.

O app baixa o cofre, descriptografa e substitui os dados locais desse aparelho pelos dados do GitHub.

### Segurança

- Use senha forte para o cofre.
- Não esqueça a senha: sem ela, o cofre não abre.
- Use repositório privado.
- Use token limitado somente ao repositório dos dados.
- Não coloque backup JSON sem criptografia no GitHub.

No iPhone com Safari:

1. Abra o app no Safari.
2. Toque no botão de compartilhar.
3. Toque em Adicionar à Tela de Início.
4. Confirme.

## 13. Como Parar O Servidor Local

No terminal onde o app está rodando:

1. Clique no terminal.
2. Aperte `Ctrl + C`.
3. Se perguntar, digite `S` ou `Y`.
4. Aperte Enter.

## 14. Como Atualizar O PWA

Depois de alterar o código:

```bash
npm run build
npm run preview
```

Abra o app novamente. Se o navegador continuar mostrando versão antiga:

1. feche o app;
2. abra o navegador;
3. limpe cache do site;
4. abra o app novamente.

## 14.1. O Que Faz O Botão De Atualizar No Topo

O botão com a seta circular, ao lado do título da tela, não atualiza o app pela internet.

Ele faz apenas isto:

- recarrega os dados locais salvos no IndexedDB;
- refaz os cálculos da tela;
- gera as contas recorrentes do mês selecionado, se ainda não tiverem sido criadas;
- mostra a mensagem `Dados locais atualizados.`

Ele é útil quando você acabou de salvar, importar backup ou mudar de mês e quer forçar uma conferência dos dados.

## 15. Como Limpar Cache Se Necessário

No Chrome:

1. Abra DevTools com `F12`.
2. Vá em Application.
3. Clique em Storage.
4. Clique em Clear site data.

Atenção: isso pode apagar os dados locais do app. Exporte backup antes.

## 16. Como Fazer Backup

Dentro do app:

1. Abra Configurações.
2. Toque em Exportar.
3. O app baixa um arquivo com nome parecido com:

```txt
backup-meu-controle-financeiro-2026-05-13.json
```

Guarde esse arquivo em local seguro.

O backup contém:

- settings;
- categories;
- recurring_bills;
- monthly_bills;
- cards;
- card_transactions;
- card_invoices;
- savings;
- learned_category_rules;
- notification_settings;
- import_logs.

## 17. Como Importar Backup

Dentro do app:

1. Abra Configurações.
2. Toque em Importar.
3. Escolha o arquivo JSON.
4. Leia o aviso.
5. Confirme somente se quiser substituir todos os dados atuais.

Regra importante:

Importar backup apaga os dados atuais e coloca os dados do arquivo no lugar.

Se o arquivo não parecer um backup válido, o app mostra erro e não altera seus dados.

## 18. Como Validar Formato De Fatura

A importação de fatura não usa OCR e não lê imagem.

Ela aceita texto colado ou arquivo `.txt` ou `.csv` simples.

Formato inicial aceito:

```txt
DATA DESCRIÇÃO VALOR
```

Exemplos:

```txt
12/04 MERCADO EXEMPLO 89,90
12/04/2026 MERCADO EXEMPLO R$ 89,90
12/04 UBER TRIP 32,50
12/04 NETFLIX 39,90
```

Também existe suporte ao CSV separado por ponto e vírgula neste formato:

```txt
Data;Estabelecimento;Portador;Valor;Parcela
01/04/2026;MERCADO EXEMPLO;PAULO;R$ 89,90;-
01/12/2025;LOJA PARCELADA;PAULO;R$ 291,77;5 de 6
25/03/2026;ESTORNO EXEMPLO;PAULO;R$ -177,30;-
```

Regras importantes desse CSV:

- valores negativos de crédito, estorno ou ajuste entram na fatura e reduzem o total;
- linhas de pagamento da fatura, como `Pagamentos Validos Normais`, são ignoradas;
- a coluna `Parcela`, quando vier como `5 de 6`, é importada como parcela 5 de 6;
- o campo `Portador` entra em observações do lançamento.

Fluxo correto:

1. Escolha o cartão.
2. Escolha o mês da fatura.
3. Cole o texto ou importe arquivo simples.
4. Toque em Validar formato.
5. Confira a prévia.
6. Edite data, descrição, valor, categoria, cartão, mês, parcelas e observações.
7. Toque em Confirmar e salvar fatura.

Nada é salvo antes da confirmação final.

Se o formato não for reconhecido, o app mostra:

```txt
Formato de fatura ainda não reconhecido. Ajuste o texto ou cadastre um modelo de importação.
```

## 19. Como O App Aprende Categorias

O app tenta categorizar por:

1. regras aprendidas por você;
2. palavras-chave padrão das categorias;
3. Sem categoria, se nada combinar.

Exemplo:

1. A fatura trouxe `PADARIA SAO JOAO`.
2. O app sugeriu Sem categoria.
3. Você mudou para Alimentação.
4. Ao salvar, o app guarda uma regra aprendida.
5. Na próxima importação, ele tende a sugerir Alimentação.

Você pode ver, editar e excluir regras em Configurações.

## 20. Como Adicionar Novos Modelos De Fatura No Futuro

Os parsers ficam em:

```txt
src/parsers/
```

O parser genérico atual fica em:

```txt
src/parsers/genericInvoiceParser.js
```

O registro de parsers fica em:

```txt
src/parsers/parserRegistry.js
```

Para adicionar um parser futuro, por exemplo XP:

1. Crie um arquivo:

```txt
src/parsers/xpInvoiceParser.js
```

2. Exporte uma função parecida com:

```js
export function parseXpInvoice(text, context) {
  return {
    ok: true,
    parserId: 'xp',
    parserName: 'XP',
    transactions: [],
    rejectedLines: [],
    message: 'Fatura XP reconhecida.',
  };
}
```

3. Abra `src/parsers/parserRegistry.js`.
4. Importe o novo parser.
5. Adicione na lista `PARSERS`.

Importante: todo parser deve devolver lançamentos para conferência. Ele nunca deve salvar nada direto no banco.

## 21. Notificações

O app tem dois tipos de aviso:

- avisos internos dentro do app;
- notificações locais do sistema, quando o navegador permitir.

Como o app não tem backend, ele não faz Web Push remoto real.

Isso significa:

- os avisos internos sempre funcionam;
- notificações do sistema dependem do navegador;
- alguns celulares exigem que o app esteja instalado;
- alguns navegadores exigem HTTPS;
- acesso pelo IP da rede Wi-Fi pode limitar notificações.

## 22. Erros Comuns

### npm foi bloqueado no PowerShell

Use:

```bash
npm.cmd install
npm.cmd run dev
```

### A página não abre no celular

Confira:

- computador e celular estão na mesma Wi-Fi;
- o comando `npm run dev` está rodando;
- você usou o IP correto;
- o firewall do Windows não bloqueou o acesso.

### O PWA não instala

Tente:

- rodar `npm run build`;
- rodar `npm run preview`;
- abrir no Chrome ou Safari;
- limpar cache do site;
- verificar se o navegador permite instalação PWA.

### As notificações não aparecem

Confira:

- permissão de notificação no navegador;
- app instalado como PWA;
- navegador compatível;
- endereço em contexto seguro.

Mesmo sem notificação do sistema, os avisos internos continuam aparecendo.

## 23. Comandos Rápidos

```bash
npm install
npm run dev
npm run build
npm run preview
```

No Windows com PowerShell bloqueando npm:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```
