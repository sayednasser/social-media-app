import { DeleteResult,  MongooseUpdateQueryOptions, PopulateOptions, Types, UpdateQuery, UpdateWithAggregationPipeline, UpdateWriteOpResult } from "mongoose";
import { AnyKeys, CreateOptions, FlattenMaps, HydratedDocument, Model, ProjectionType, QueryFilter, QueryOptions } from "mongoose";
export class BaseRepository<TRawDocument> {
  constructor(protected model: Model<TRawDocument>) { }
  async create({ data }:
    { data: AnyKeys<TRawDocument> })
    : Promise<HydratedDocument<TRawDocument>>
  async create({ data, options }:
    { data: AnyKeys<TRawDocument>[], options?: CreateOptions })
    : Promise<HydratedDocument<TRawDocument>[]>
  async create({ data, options }:
    { data: AnyKeys<TRawDocument> | AnyKeys<TRawDocument>[], options?: CreateOptions })
    : Promise<
      HydratedDocument<TRawDocument> | HydratedDocument<TRawDocument>[]
    > {
    return this.model.create(data as any, options)
  }
  async createOne({ data, options = {} }:
    { data: AnyKeys<TRawDocument>, options?: CreateOptions })
    : Promise<HydratedDocument<TRawDocument>> {
    const [result] = await this.create({ data: [data], options: options }) || []
    return result as HydratedDocument<TRawDocument>
  }



  async findOne({ filter, projection, options }: {
    filter: QueryFilter<TRawDocument>,
    projection?: ProjectionType<TRawDocument> | null,
    options?: QueryOptions<TRawDocument> & { lean: false }
  }): Promise<HydratedDocument<TRawDocument> | null>;


  async findOne({ filter, projection, options }:
    {
      filter: QueryFilter<TRawDocument>,
      projection?: ProjectionType<TRawDocument> | null,
      options?: QueryOptions<TRawDocument> & { lean: true }
    }): Promise<FlattenMaps<TRawDocument> | null>;

  async findOne({ filter = {}, projection, options }: {
    filter: QueryFilter<TRawDocument>,
    projection?: ProjectionType<TRawDocument> | null,
    options?: QueryOptions<TRawDocument>
  }): Promise<HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null> {
    const doc = this.model.findOne(filter, projection)
    if (options?.lean) { doc.lean(options.lean) }
    if (options?.populate) { doc.populate(options.populate as PopulateOptions[]) }

    return await doc.exec()

  }
  async findById({ _id, projection, options }: {
    _id: Types.ObjectId,
    projection?: ProjectionType<TRawDocument> | null,
    options?: QueryOptions<TRawDocument>
  }): Promise<HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null>
  async findById({ _id, projection, options }: {
    _id: Types.ObjectId,
    projection?: ProjectionType<TRawDocument> | null,
    options?: QueryOptions<TRawDocument>
  }): Promise<HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null>
  async findById({ _id, projection, options }: {
    _id: Types.ObjectId,
    projection?: ProjectionType<TRawDocument> | null,
    options?: QueryOptions<TRawDocument>
  }): Promise<HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null> {
    const doc = this.model.findById(_id, projection)
    if (options?.lean) { doc.lean(options.lean) }
    if (options?.populate) { doc.populate(options.populate as PopulateOptions[]) }
    return await doc.exec()
  }

  async updataOne({ filter, update, options }: {
    filter: QueryFilter<TRawDocument>,
    update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,
    options?: MongooseUpdateQueryOptions<TRawDocument>
  }): Promise<UpdateWriteOpResult> {

    return this.model.updateOne(filter, update, options)
  }
  async updataMany({ filter, update, options }: {
    filter: QueryFilter<TRawDocument>,
    update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,
    options?: MongooseUpdateQueryOptions<TRawDocument>
  }): Promise<UpdateWriteOpResult> {

    return this.model.updateMany(filter, update, options)
  }

  async deleteOne({ filter }: {
    filter: QueryFilter<TRawDocument>,

  }): Promise<DeleteResult> {
    return this.model.deleteOne(filter)
  }
  async deleteMany({ filter }: {
    filter: QueryFilter<TRawDocument>,

  }): Promise<DeleteResult> {
    return this.model.deleteMany(filter)
  }
  async findOneAndUpdate({ filter, update, options }: {
    filter: QueryFilter<TRawDocument>,
    update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,
    options?: MongooseUpdateQueryOptions<TRawDocument>
  }): Promise<HydratedDocument<TRawDocument> | null> {

    return this.model.findOneAndUpdate(filter, update, options)
  }
  async findByIdAndUpdate({ _id, update, options }: {
    _id: Types.ObjectId,
    update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,
    options?: MongooseUpdateQueryOptions<TRawDocument>
  }): Promise<HydratedDocument<TRawDocument> | null> {

    return this.model.findByIdAndUpdate(_id, update, options)
  }
  async findOneAndDelete({ filter = {} }: {
    filter: QueryFilter<TRawDocument>,
  }): Promise<HydratedDocument<TRawDocument>|null> {

    return this.model.findOneAndDelete(filter)
  }
   async findByIdAndDelete({ _id }: {
    _id: QueryFilter<TRawDocument>,
  }): Promise<HydratedDocument<TRawDocument>|null> {

    return this.model.findByIdAndDelete(_id)
  }



}
