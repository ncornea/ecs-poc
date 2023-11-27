import { Types, defineComponent } from 'bitecs';

export const Position = defineComponent({
  row: Types.ui8,
  col: Types.ui8,
  flip: Types.ui8
});
