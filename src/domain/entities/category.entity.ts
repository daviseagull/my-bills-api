import { Entity } from '../abstracts/entity'
import { Color } from '../value-objects/color'

export interface ICategory {
  description: string
  color: Color
  parent?: string | null
}

type CategoryProps = {
  user: string
  incomes: ICategory[]
  expenses: ICategory[]
}

export class Category extends Entity<CategoryProps> {
  private constructor(props: CategoryProps, id?: string) {
    super(props, id)
  }

  get id() {
    return this._id
  }

  static create(props: CategoryProps, id?: string) {
    return new Category(props, id)
  }
}
