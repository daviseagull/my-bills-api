import { Category, ICategory } from '@/domain/entities/category.entity'
import { Color } from '@/domain/value-objects/color'
import { PrismaCategory, Category as RawCategory } from '@prisma/client'

export class CategoryPrismaMapper {
  static toDomain(raw: RawCategory): Category {
    const category = Category.create(
      {
        user: raw.cognitoUser,
        incomes: this.mapCategories(raw.incomes),
        expenses: this.mapCategories(raw.expenses)
      },
      raw.id
    )

    return category
  }

  private static mapCategories(
    prismaCategories: PrismaCategory[]
  ): ICategory[] {
    const categories = prismaCategories.map((category: PrismaCategory) => {
      return {
        description: category.description,
        color: Color.create(category.color),
        parent: category.parent
      }
    })
    return categories
  }
}
