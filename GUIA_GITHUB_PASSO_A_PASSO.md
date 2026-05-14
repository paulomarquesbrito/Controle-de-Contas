# Guia Para Rodar O App Com GitHub Pages E Dados Privados

Este guia explica, do jeito mais simples possível, como deixar o app funcionando no celular e sincronizando os dados entre você e sua esposa.

## Visão Geral

Você vai usar 2 repositórios no GitHub:

```txt
1. Repositório do app
   Público
   Serve para instalar/abrir o app pelo GitHub Pages

2. Repositório dos dados
   Privado
   Guarda o arquivo criptografado com os dados financeiros
```

Exemplo:

```txt
meu-controle-financeiro-app
meu-controle-financeiro-dados
```

O app público não contém suas contas, cartões ou faturas.

Os dados ficam em um arquivo criptografado no repositório privado dos dados.

## Precisa Criptografar Mesmo Com Repositório Privado?

Minha recomendação: sim.

O repositório privado já ajuda bastante, mas criptografia adiciona uma segunda proteção.

Pense assim:

```txt
Repositório privado = porta trancada
Criptografia = cofre trancado dentro da sala
```

Por que isso é bom:

- se o token do GitHub vazar, o arquivo ainda está criptografado;
- se alguém for adicionado sem querer ao repositório, não lê os dados sem senha;
- se você baixar o arquivo e mandar para alguém sem querer, ele continua protegido;
- se no futuro o repositório virar público por engano, os dados não ficam legíveis;
- GitHub guarda o arquivo, mas não sabe a senha do cofre.

O ponto negativo:

- se você esquecer a senha do cofre, não dá para recuperar os dados criptografados.

Por isso, guarde a senha em local seguro.

## Parte 1: Criar O Repositório Público Do App

1. Entre no GitHub.
2. Clique em `New repository`.
3. Nome sugerido:

```txt
meu-controle-financeiro-app
```

4. Marque como `Public`.
5. Crie o repositório.

Esse repositório vai hospedar o app pelo GitHub Pages.

## Parte 2: Enviar Os Arquivos Do App

Envie para o repositório público estes arquivos e pastas:

```txt
.github
public
src
index.html
package.json
package-lock.json
postcss.config.js
tailwind.config.js
vite.config.js
README.md
GUIA_GITHUB_PASSO_A_PASSO.md
```

Não precisa enviar:

```txt
node_modules
dist
```

O GitHub vai recriar o `dist` sozinho.

## Parte 3: Ativar GitHub Pages

No repositório público do app:

1. Abra `Settings`.
2. Clique em `Pages`.
3. Em `Build and deployment`, escolha:

```txt
GitHub Actions
```

4. Vá na aba `Actions`.
5. Espere o workflow terminar.

O app deve ficar em um endereço parecido com:

```txt
https://SEU-USUARIO.github.io/meu-controle-financeiro-app/
```

Abra esse link no celular.

## Parte 4: Criar O Repositório Privado Dos Dados

1. No GitHub, clique em `New repository`.
2. Nome sugerido:

```txt
meu-controle-financeiro-dados
```

3. Marque como `Private`.
4. Crie o repositório.

Esse repositório não precisa de GitHub Pages.

Ele serve apenas para guardar o arquivo criptografado:

```txt
data/encrypted-finance-data.json
```

## Parte 5: Criar O Token Do GitHub

O app precisa de permissão para ler e gravar o arquivo criptografado no repositório privado.

Crie um token limitado.

1. No GitHub, clique na sua foto.
2. Abra `Settings`.
3. Role até `Developer settings`.
4. Abra `Personal access tokens`.
5. Clique em `Fine-grained tokens`.
6. Clique em `Generate new token`.
7. Dê um nome, por exemplo:

```txt
Meu Controle Financeiro
```

8. Em `Repository access`, escolha somente:

```txt
meu-controle-financeiro-dados
```

9. Em permissões, configure:

```txt
Contents: Read and write
```

10. Gere o token.
11. Copie o token.

Guarde esse token com cuidado.

## Parte 6: Configurar O Cofre No App

Abra o app pelo link do GitHub Pages.

Vá em:

```txt
Configurações > Cofre familiar no GitHub
```

Preencha:

```txt
Usuário/owner: seu usuário do GitHub
Repositório: meu-controle-financeiro-dados
Branch: main
Arquivo: data/encrypted-finance-data.json
Token: token que você copiou
Senha do cofre: senha combinada entre você e sua esposa
```

Depois toque em:

```txt
Salvar configuração local
```

## Parte 7: Primeiro Envio Dos Dados

No aparelho que tem os dados certos:

1. Abra `Configurações`.
2. Vá em `Cofre familiar no GitHub`.
3. Digite a senha do cofre.
4. Toque em `Enviar`.

Isso cria o arquivo criptografado no repositório privado.

## Parte 8: Configurar No Celular Da Sua Esposa

No celular dela:

1. Abra o mesmo link do GitHub Pages.
2. Instale o app se o navegador permitir.
3. Abra `Configurações`.
4. Vá em `Cofre familiar no GitHub`.
5. Preencha os mesmos dados:

```txt
Usuário/owner
Repositório
Branch
Arquivo
Token
Senha do cofre
```

6. Toque em `Salvar configuração local`.
7. Toque em `Baixar`.

O app vai baixar o cofre, abrir com a senha e substituir os dados locais do celular dela.

## Regra Para Não Dar Conflito

Como vocês disseram que não vão editar ao mesmo tempo, usem esta regra:

```txt
Antes de mexer: Baixar
Depois de mexer: Enviar
```

Exemplo:

```txt
Você vai lançar contas:
1. Baixar
2. Lançar contas
3. Enviar

Sua esposa vai lançar compras:
1. Baixar
2. Lançar compras
3. Enviar
```

Se o app avisar que o cofre remoto mudou, o mais seguro é:

```txt
Baixar primeiro
Conferir os dados
Depois enviar novamente se necessário
```

Use `Forçar envio` apenas se tiver certeza de que quer substituir o arquivo do GitHub pelos dados deste aparelho.

## O Que Fica Onde

No GitHub Pages público:

```txt
app vazio
código
telas
ícones
CSS
JavaScript
```

No GitHub privado dos dados:

```txt
arquivo criptografado
```

No celular/navegador:

```txt
dados abertos no IndexedDB
token do GitHub
configuração do cofre
```

## Cuidados Importantes

- Não suba backup JSON aberto no GitHub.
- Use senha forte no cofre.
- Não perca a senha.
- Não compartilhe o token.
- Se trocar de celular, configure de novo e toque em `Baixar`.
- Se algo parecer errado, faça backup manual antes de importar ou substituir dados.
