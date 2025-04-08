INSERT INTO tags (id, name, colour, visibility) VALUES
  ('tag-1', 'Weapon', '#FF0000', 'public', 'user_2vSGmv5isGNdtzsJp2AhzAAGHvo'),
  ('tag-2', 'Flower', '#00FF00', 'public', 'user_2vSGmv5isGNdtzsJp2AhzAAGHvo'),
  ('tag-3', 'Car', '#0000FF', 'public', 'user_2vSGmv5isGNdtzsJp2AhzAAGHvo'),
  ('tag-4', 'Sword', '#00FFF0', 'public', 'user_2vSGmv5isGNdtzsJp2AhzAAGHvo');


INSERT INTO tag_groups (id, parent_id) VALUES
  ('group-1', 'tag-1'),
  ('group-2', 'tag-2'),
  ('group-3', 'tag-3'),
  ('group-4', 'tag-4');

INSERT INTO tag_group_tag_relations (tag_group_id, tag_id) VALUES
  ('group-1', 'tag-1'),
  ('group-2', 'tag-2'),
  ('group-3', 'tag-3'),
  ('group-1', 'tag-4');

INSERT INTO attribute_types (id, name, visibility) VALUES
  ('attr-1', 'Material', 'public'),
  ('attr-2', 'Colour', 'public'),
  ('attr-3', 'Species', 'public');

INSERT INTO attribute_type_tag_relations (attribute_type_id, tag_id) VALUES
  ('attr-1', 'tag-1'),
  ('attr-2', 'tag-1'),
  ('attr-2', 'tag-2'),
  ('attr-3', 'tag-2'),
  ('attr-2', 'tag-3'),
  ('attr-1', 'tag-4'),
  ('attr-2', 'tag-4');
