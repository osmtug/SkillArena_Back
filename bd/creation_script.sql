CREATE TABLE IF NOT EXISTS public.users
(
    id SERIAL  NOT NULL,
    name text COLLATE pg_catalog."default",
    password text COLLATE pg_catalog."default" NOT NULL,
    creationdate date DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.games
(
    id SERIAL  NOT NULL,
    name text COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    score_order text COLLATE pg_catalog."default" NOT NULL,
    time_used boolean NOT NULL DEFAULT false,
    CONSTRAINT games_pkey PRIMARY KEY (id),
    CONSTRAINT games_name_key UNIQUE (name),
    CONSTRAINT games_score_order_check CHECK (score_order = ANY (ARRAY['DESC'::text, 'ASC'::text]))
);

CREATE TABLE IF NOT EXISTS public.game_sessions
(
    id SERIAL  NOT NULL,
    user_id integer NOT NULL,
    game_id integer NOT NULL,
    score integer NOT NULL,
    duration_ms integer,
    finished boolean DEFAULT true,
    played_at timestamp without time zone DEFAULT now(),
    CONSTRAINT game_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT game_sessions_game_id_fkey FOREIGN KEY (game_id)
        REFERENCES public.games (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT game_sessions_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX idx_game_sessions_game_score
ON public.game_sessions (game_id, score DESC, duration_ms ASC);

CREATE INDEX idx_game_sessions_user_game
ON public.game_sessions (user_id, game_id);


insert into games (name, description, score_order, time_used) values ('Snake', 'Snake game', 'ASC', TRUE);
insert into games (name, description, score_order, time_used) values ('Flappy Bird', 'Flappy Bird game', 'ASC', False);
insert into games (name, description, score_order, time_used) values ('TETRIS', 'TETRIS game', 'ASC', False);

