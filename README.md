# hack the ekopost plzz

## run

move the generated invoices folder created by the ekopostprocessor
to this folder

run each separated folder by there number by changing the line 42
this will essentially login to ekopost, upload all of the images -> and then send them out

```bash
yarn build && node dist/index.js
```

## improvements

- parse the invoices directory directly and ask the user which folder to upload
- press the send button -> until we see high five then ask the user again
- can create multiple sessions and upload all folders at the same time
