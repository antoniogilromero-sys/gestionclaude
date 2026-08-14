-- Marca qué próximas competiciones son del Circuito Escolar, para
-- pintarlas de otro color en la lista (azul claro, a petición de Antón).

alter table proximas_competiciones
  add column if not exists es_escolar boolean not null default false;

-- Las 6 que ya se cargaron con "Circuito Escolar" en las notas se marcan
-- solas — no hace falta tocarlas a mano una por una.
update proximas_competiciones
set es_escolar = true
where notas ilike '%circuito escolar%';
