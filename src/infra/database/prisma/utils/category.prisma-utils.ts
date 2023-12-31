import { ICategory } from '@/domain/entities/category.entity'
import { Color } from '@/domain/value-objects/color'
import { PrismaCategory } from '@prisma/client'

export class CategoryPrismaUtils {
  static toCategories(prismaCategories: PrismaCategory[]): ICategory[] {
    const categories = prismaCategories.map((category: PrismaCategory) => {
      return {
        description: category.description,
        color: Color.create(category.color),
        parent: category.parent
      }
    })
    return categories
  }

  static toPrismaCategories(categories: ICategory[]): PrismaCategory[] {
    const prismaCategories = categories.map((category: ICategory) => {
      return {
        description: category.description,
        color: category.color.props.value,
        parent: category.parent!
      }
    })
    return prismaCategories
  }
}
