CREATE PROCEDURE add_history(
  user_id TEXT,
  recipe_id INTEGER
) LANGUAGE plpgsql
AS $$
#variable_conflict use_variable
DECLARE
  last_recipe_id INTEGER;
BEGIN
  SELECT
    history.recipe_id INTO last_recipe_id
  FROM history
  WHERE history.user_id = user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND OR last_recipe_id != recipe_id THEN
    INSERT INTO history (user_id, recipe_id) VALUES (user_id, recipe_id);
  END IF;
END $$;
