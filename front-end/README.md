# Minimal Starting Front-End with Authentication

## What it is

This minimal app is able to :

- send an http login request to the back-end,
- use the returned token (in case of success) to perform requests that need authentication,
- and display the content of the user table.

It is also able to register a new user.

## Convenient Makefile

- `make dev` install developer environment (`npm install`).
- `make web` run react-native web emulator.
- `make clean.dev` remove developer environment.

## Mobile application

### Metro

```bash
npm start
```

### Android

```
adb kill-server
adb devices
adb reverse tcp:5000 tcp:5000
npm run android
```

## Web Front-End

To get the app up and running on [localhost](http://localhost:8080):

```shell
npm install
# DO NOT TYPE: npm audit fix --force
npm run web
```

Enable the _Responsive Design Mode_ to play with various device screen sizes and
_Web Developer Tools_ to display the console and network activity.

## TODO or not?

- rename `Pizza` or `Projet`?
- remove the 6 last remaining `any` types